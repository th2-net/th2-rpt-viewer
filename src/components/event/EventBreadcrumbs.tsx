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
import { EventIdNode } from '../../stores/EventWindowStore';
import { createBemElement } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import '../../styles/events.scss';
import useCachedEvent from '../../hooks/useCachedEvent';

interface Props {
	nodes: EventIdNode[];
	rootEventsEnabled?: boolean;
	onSelect: (node: EventIdNode | null) => void;
}

export default function EventBreadcrumbs({ nodes, onSelect, rootEventsEnabled = false }: Props) {
	return (
		<div className='event-breadcrumbs'>
			{
				rootEventsEnabled ? (
					<React.Fragment>
						<div className='event-breadcrumbs__item'
							 onClick={() => onSelect(null)}>
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
				nodes.map((node, i) => (
					<React.Fragment key={i}>
						<EventBreadcrumbsItem
							key={i}
							node={node}
							onSelect={() => onSelect(node)}/>
						{
							i === nodes.length - 1
								? <div className='event-breadcrumbs__divider-last'/>
								: <div className='event-breadcrumbs__divider'/>
						}
					</React.Fragment>
				))
			}
		</div>
	);
}

interface ItemProps {
	node: EventIdNode;
	onSelect: () => void;
}

const EventBreadcrumbsItem = observer(({ node, onSelect }: ItemProps) => {
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

	return (
		<div className={rootClass}
			 onClick={() => onSelect()}>
			<div className='event-breadcrumbs__name' title={event.eventName}>
				{event.eventName}
			</div>
			— {status[0].toUpperCase()}
		</div>
	);
});
