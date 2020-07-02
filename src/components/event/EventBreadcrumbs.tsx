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
import useResizeObserver from 'use-resize-observer';
import { EventIdNode } from '../../stores/EventsStore';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import '../../styles/events.scss';
import useCachedEvent from '../../hooks/useCachedEvent';

const BREADCRUMB_ITEM_MAX_WIDTH = 170;
const ROOT_ICONS_WIDTH = 90;

interface Props {
	nodes: EventIdNode[];
	rootEventsEnabled?: boolean;
	onSelect?: (node: EventIdNode | null) => void;
	onMouseEnter?: (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>,
		isMinified: boolean,
		fullWidth: number
	) => void;
	onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onExpand?: (isExpanded: boolean) => void;
	showAll?: boolean;
}

export interface EventBreadcrumbsForwardingRef {
	isExpanded: boolean;
	isMinified: boolean;
	expand: () => void;
	collapse: () => void;
}

const EventBreadcrumbs: React.RefForwardingComponent<EventBreadcrumbsForwardingRef, Props> = (props, ref) => {
	const {
		nodes,
		onSelect,
		rootEventsEnabled = false,
		onMouseLeave,
		onMouseEnter,
		showAll = false,
		onExpand,
	} = props;

	const rootRef = React.useRef<HTMLDivElement>(null);
	const [visibleItemsCount, setVisibleItemsCount] = React.useState(nodes.length);
	const [isMinified, setIsMinified] = React.useState(false);
	const { width = 1, height = 36 } = useResizeObserver({ ref: rootRef });
	const [isExpanded, setIsExpanded] = React.useState(showAll);
	const [itemMaxWidth, setItemMaxWIdth] = React.useState(BREADCRUMB_ITEM_MAX_WIDTH);

	React.useEffect(() => {
		if (isExpanded) {
			setVisibleItemsCount(nodes.length);
			setIsMinified(false);
			return;
		}
		const renderableBreadcrumbsCount = Math.max(
			1, Math.floor((width - ROOT_ICONS_WIDTH) / BREADCRUMB_ITEM_MAX_WIDTH),
		);
		const minify = nodes.length > 0 && renderableBreadcrumbsCount > 0
			&& (renderableBreadcrumbsCount < nodes.length);
		if (renderableBreadcrumbsCount === 1) {
			const maxWidth = width - ROOT_ICONS_WIDTH;
			setItemMaxWIdth(maxWidth > BREADCRUMB_ITEM_MAX_WIDTH ? BREADCRUMB_ITEM_MAX_WIDTH : maxWidth);
		} else {
			setItemMaxWIdth(BREADCRUMB_ITEM_MAX_WIDTH);
		}
		setVisibleItemsCount(renderableBreadcrumbsCount);

		if (minify !== isMinified) {
			setIsMinified(minify);
		}
	}, [nodes, width, isExpanded]);

	React.useEffect(() => {
		if (showAll) return;
		setIsExpanded(height > 36);
		if (onExpand) {
			onExpand(height > 36);
		}
	}, [height]);

	const visibleBreadcrumbs = nodes.slice(showAll ? 0 : -visibleItemsCount);

	React.useImperativeHandle(ref, () => ({
		get isExpanded() {
			return isExpanded && height > 36;
		},
		get isMinified() {
			return isMinified;
		},
		expand: () => {
			if (!isMinified) return;
			setIsExpanded(true);
			if (onExpand) {
				onExpand(height > 36);
			}
		},
		collapse: () => {
			setIsExpanded(false);
			if (onExpand) {
				onExpand(height > 36);
			}
		},
	}));

	return (
		<div
			className='event-breadcrumbs'
			style={{ flexWrap: isExpanded || showAll ? 'wrap' : 'nowrap' }}
			ref={rootRef}
			onMouseLeave={onMouseLeave}>
			<div
				className="event-breadcrumbs__root-icon"
				onClick={() => onSelect && onSelect(null)}/>
			{
				rootEventsEnabled && ((visibleItemsCount >= nodes.length + 1) || isExpanded) ? (
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
			{
				isMinified
				&& <div
					className='event-breadcrumbs__minified'
					onMouseEnter={event => {
						if (onMouseEnter) {
							onMouseEnter(event, isMinified, (nodes.length + 1) * (BREADCRUMB_ITEM_MAX_WIDTH));
						}
					}}>
					<div>...</div>
					<div className='event-breadcrumbs__divider'/>
				</div>
			}
			{
				visibleBreadcrumbs.map((node, i) => (
					<EventBreadcrumbsItem
						maxWidth={isExpanded ? BREADCRUMB_ITEM_MAX_WIDTH : itemMaxWidth}
						key={node.id}
						node={node}
						onSelect={() => onSelect && onSelect(node)}
						isLast={i === visibleBreadcrumbs.length - 1}/>
				))
			}
		</div>
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
			 }}>
			<div className={nameClassName} title={event.eventName}>
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
