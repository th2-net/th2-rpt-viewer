/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { motion, useAnimation } from 'framer-motion';
import useResizeObserver from 'use-resize-observer';
import { EventIdNode } from '../../stores/EventsStore';
import { createBemElement } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import useCachedEvent from '../../hooks/useCachedEvent';
import '../../styles/events.scss';

const BREADCRUMB_ITEM_MAX_WIDTH = 150;
const ROOT_ITEM_WIDTH = 140;
const ROOT_ITEM_MINIFIED_WIDTH = 50;
const MINIFY_ICON_WIDTH = 30;

interface Props {
	nodes: EventIdNode[];
	onSelect?: (node: EventIdNode | null) => void;
	onExpand?: (isExpanded: boolean) => void;
	showAll?: boolean;
}

export interface EventBreadcrumbsForwardingRef {
	expand: () => void;
	collapse: () => void;
}

const EventBreadcrumbs: React.RefForwardingComponent<EventBreadcrumbsForwardingRef, Props> = (props, ref) => {
	const {
		nodes,
		onSelect,
		showAll = false,
		onExpand,
	} = props;

	const rootRef = React.useRef<HTMLDivElement>(null);
	const [visibleItemsCount, setVisibleItemsCount] = React.useState(nodes.length);
	const [isMinified, setIsMinified] = React.useState(false);
	const { width = 1 } = useResizeObserver({ ref: rootRef });
	const [isExpanded, setIsExpanded] = React.useState(showAll);
	const [itemMaxWidth, setItemMaxWidth] = React.useState(BREADCRUMB_ITEM_MAX_WIDTH);

	const controls = useAnimation();

	React.useEffect(() => {
		if (isExpanded) {
			setVisibleItemsCount(nodes.length + 1);
			setIsMinified(false);
			return;
		}

		let renderableBreadcrumbsCount = Math.max(1, Math.floor(width / BREADCRUMB_ITEM_MAX_WIDTH));

		if (renderableBreadcrumbsCount > nodes.length) {
			setIsMinified(false);
			setItemMaxWidth(BREADCRUMB_ITEM_MAX_WIDTH);
			setVisibleItemsCount(renderableBreadcrumbsCount);
			return;
		}

		if (renderableBreadcrumbsCount > 1) {
			renderableBreadcrumbsCount = (width - renderableBreadcrumbsCount * BREADCRUMB_ITEM_MAX_WIDTH) < 90
				? renderableBreadcrumbsCount - 1
				: renderableBreadcrumbsCount;
			setIsMinified(renderableBreadcrumbsCount < nodes.length);
			setVisibleItemsCount(renderableBreadcrumbsCount);
			setItemMaxWidth((width - 90) / renderableBreadcrumbsCount);
			return;
		}
		const maxWidth = width - 80;
		setIsMinified(nodes.length !== 1);
		setVisibleItemsCount(1);
		setItemMaxWidth(width < BREADCRUMB_ITEM_MAX_WIDTH ? width : maxWidth);
	}, [nodes, width, isExpanded]);

	const visibleBreadcrumbs = nodes.slice(showAll ? 0 : -visibleItemsCount);

	React.useImperativeHandle(ref, () => ({
		expand: () => {
			if (!isMinified) return;
			setIsExpanded(true);
			if (onExpand) {
				onExpand(true);
			}
			controls.start({
				height: 'auto',
				transition: { duration: 0.5, delay: 0 },
			});
		},
		collapse: () => {
			if (!isExpanded) return;
			setIsExpanded(false);
			controls.start({
				height: '36px',
				transition: { duration: 0.5, delay: 0 },
			}).then(() => {
				if (onExpand) {
					onExpand(false);
				}
			});
		},
	}));

	return (
		<motion.div
			animate={controls}
			className='event-breadcrumbs'
			ref={rootRef}>
			{((width > BREADCRUMB_ITEM_MAX_WIDTH) || isExpanded) && <motion.div
				className="event-breadcrumbs__root-item"
				positionTransition={{ duration: 0.5, damping: 120, stiffness: 10 }}
				key="root">
				<div
					className="event-breadcrumbs__root-icon"
					onClick={() => onSelect && onSelect(null)}/>
				{
					 !nodes.length || (!isMinified && (visibleItemsCount > nodes.length)) ? (
						<div className='event-breadcrumbs__item'
							onClick={() => onSelect && onSelect(null)}>
							Root events
						</div>
					) : null
				}
				{
					nodes.length > 0
						? <div className='event-breadcrumbs__divider'/>
						: <div className='event-breadcrumbs__divider-last'/>
				}
			</motion.div>}
			{
				isMinified && visibleItemsCount > 1
				&& <div className='event-breadcrumbs__minified'>
					<div>...</div>
					<div className='event-breadcrumbs__divider'/>
				</div>
			}
			{
				visibleBreadcrumbs.map((node, index) => (
					<motion.div
						key={node.id}
						positionTransition={{ duration: 0.5, damping: 120, stiffness: 10 }}>
						<EventBreadcrumbsItem
							maxWidth={isExpanded && (width > BREADCRUMB_ITEM_MAX_WIDTH)
								? BREADCRUMB_ITEM_MAX_WIDTH : itemMaxWidth}
							node={node}
							onSelect={() => onSelect && onSelect(node)}
							isLast={index === visibleBreadcrumbs.length - 1} />
					</motion.div>
				))
			}
		</motion.div>
	);
};

export default observer(EventBreadcrumbs, { forwardRef: true });

interface ItemProps {
	node: EventIdNode;
	onSelect: () => void;
	isLast?: boolean;
	maxWidth? : number;
}

const EventBreadcrumbsItem = observer(({
	node,
	onSelect,
	isLast,
	maxWidth = BREADCRUMB_ITEM_MAX_WIDTH,
}: ItemProps) => {
	const event = useCachedEvent(node);

	if (!event) {
		return (
			<div className='event-breadcrumbs__item-skeleton'/>
		);
	}

	const status = getEventStatus(event);

	const rootClass = createBemElement(
		'event-breadcrumbs',
		'item',
		status,
	);

	const nameClassName = createBemElement(
		'event-breadcrumbs',
		'name',
		isLast ? 'last' : null,
	);

	return (
		<div className={rootClass}
			 onClick={() => onSelect()}
			 style={{
				 maxWidth,
			 }}
			 title={event.eventName}>
			<div className={nameClassName}>
				{event.eventName}
			</div>
			<span className="event-breadcrumbs__status">
				— {status[0].toUpperCase()}
			</span>
			{
				isLast
					? <div className='event-breadcrumbs__divider-last'/>
					: <div className='event-breadcrumbs__divider'/>
			}
		</div>
	);
});
