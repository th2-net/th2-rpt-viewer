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
import { EventIdNode } from '../../stores/EventsStore';
import { createBemElement } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import useCachedEvent from '../../hooks/useCachedEvent';
import '../../styles/events.scss';

interface Props {
	nodes: EventIdNode[];
	onSelect?: (node: EventIdNode | null) => void;
	rootEventsEnabled?: boolean;
}

export interface EventBreadcrumbsForwardingRef {
	expand: () => void;
	collapse: () => void;
}

const EventBreadcrumbs: React.FC<Props> = props => {
	const {
		nodes,
		onSelect,
		rootEventsEnabled = true,
	} = props;

	const rootRef = React.useRef<HTMLUListElement>(null);

	return (
		<nav>
			<ul
				className='event-breadcrumbs'
				ref={rootRef}>
				{
					rootEventsEnabled && (
						<EventBreadcrumbRootItem onSelect={onSelect && (() => onSelect(null))} />
					)}
				{
					nodes.map(node => (
						<EventBreadcrumbsItem
							node={node}
							key={node.id}
							onSelect={onSelect && (() => onSelect(node))} />
					))
				}
			</ul>
		</nav>
	);
};

export default observer(EventBreadcrumbs);

interface ItemProps {
	node: EventIdNode;
	onSelect?: () => void;
}

export const EventBreadcrumbsItem = observer(({
	node,
	onSelect,
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
		onSelect ? null : 'disabled',
	);

	const nameClassName = createBemElement(
		'event-breadcrumbs',
		'name',
		onSelect ? null : 'disabled',
	);

	return (
		<li className={rootClass}
			 onClick={() => onSelect && onSelect()}
			 title={event.eventName}>
			<span className={nameClassName}>
				{event.eventName}
			</span>
		</li>
	);
});

interface RootItemProps {
	onSelect?: () => void;
}

export const EventBreadcrumbRootItem = ({ onSelect }: RootItemProps) => {
	const nameClassName = createBemElement(
		'event-breadcrumbs',
		'name',
		onSelect ? null : 'disabled',
	);

	return (
		<li
			className="event-breadcrumbs__item"
			key="root">
			<span
				className="event-breadcrumbs__root-icon"
				onClick={() => onSelect && onSelect()} />
			<span className={nameClassName}
				onClick={() => onSelect && onSelect()}>
				Root events
			</span>
		</li>
	);
};
