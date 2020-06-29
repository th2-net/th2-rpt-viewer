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
import { createBemElement } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import useCachedEvent from '../../hooks/useCachedEvent';
import '../../styles/events.scss';

const BREADCRUMB_ITEM_MAX_WIDTH = 170;

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
}

function EventBreadcrumbs({
	nodes,
	onSelect,
	rootEventsEnabled = false,
	onMouseLeave,
	onMouseEnter,
}: Props) {
	const rootRef = React.useRef<HTMLDivElement>(null);
	const [visibleItemsCount, setVisibleItemsCount] = React.useState(nodes.length);
	const [isMinified, setIsMinified] = React.useState(false);
	const { width = 1 } = useResizeObserver({ ref: rootRef });

	React.useEffect(() => {
		const renderableBreadcrumbsCount = Math.max(1, Math.round(width / BREADCRUMB_ITEM_MAX_WIDTH) - 1);
		const minify = nodes.length > 0 && renderableBreadcrumbsCount > 0
			&& (renderableBreadcrumbsCount < nodes.length);
		setVisibleItemsCount(renderableBreadcrumbsCount);

		if (minify !== isMinified) {
			setIsMinified(minify);
		}
	}, [nodes, width]);

	const visibleBreadcrumbs = nodes.slice(-visibleItemsCount);

	return (
		<div
			className='event-breadcrumbs'
			ref={rootRef}
			onMouseLeave={onMouseLeave}>
			{
				rootEventsEnabled && !(visibleItemsCount === 1 && nodes.length > 0) ? (
					<React.Fragment>
						<div className='event-breadcrumbs__item'
							 onClick={() => onSelect && onSelect(null)}>
							Root events
						</div>
						{
							nodes.length > 0
								? <div className='event-breadcrumbs__divider'/>
								: <div className='event-breadcrumbs__divider-last'/>
						}
					</React.Fragment>
				) : null
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
						key={node.id}
						node={node}
						onSelect={() => onSelect && onSelect(node)}
						isLast={i === visibleBreadcrumbs.length - 1}/>
				))
			}
		</div>
	);
}

export default observer(EventBreadcrumbs);

interface ItemProps {
	node: EventIdNode;
	onSelect: () => void;
	isLast?: boolean;
}

const EventBreadcrumbsItem = observer(({ node, onSelect, isLast }: ItemProps) => {
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
				 maxWidth: BREADCRUMB_ITEM_MAX_WIDTH,
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
