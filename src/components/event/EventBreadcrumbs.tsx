/** *****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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
import { EventTreeNode } from '../../models/EventAction';
import { createBemElement } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';
import '../../styles/events.scss';

interface Props {
	nodes: EventTreeNode[];
	onSelect?: (node: EventTreeNode | null) => void;
	rootEventsEnabled?: boolean;
}

const EventBreadcrumbs = (props: Props) => {
	const { nodes, onSelect, rootEventsEnabled = true } = props;

	const rootRef = React.useRef<HTMLUListElement>(null);

	return (
		<nav>
			<ul className='event-breadcrumbs' ref={rootRef}>
				{rootEventsEnabled && (
					<EventBreadcrumbRootItem onSelect={onSelect && (() => onSelect(null))} />
				)}
				{nodes.map(node => (
					<EventBreadcrumbsItem
						node={node}
						key={node.eventId}
						onSelect={onSelect && (() => onSelect(node))}
					/>
				))}
			</ul>
		</nav>
	);
};

export default observer(EventBreadcrumbs);

interface ItemProps {
	node: EventTreeNode;
	onSelect?: () => void;
	isLoading?: boolean;
}

export const EventBreadcrumbsItem = observer(({ node, onSelect, isLoading = !node }: ItemProps) => {
	if (isLoading) {
		return <div className='event-breadcrumbs__item-skeleton' />;
	}

	const status = getEventStatus(node);

	const rootClass = createBemElement(
		'event-breadcrumbs',
		'item',
		status,
		onSelect ? null : 'disabled',
	);

	const nameClassName = createBemElement('event-breadcrumbs', 'name', onSelect ? null : 'disabled');

	return (
		<li className={rootClass} onClick={onSelect} title={node.eventName}>
			<span className={nameClassName}>{node.eventName}</span>
		</li>
	);
});

interface RootItemProps {
	onSelect?: () => void;
}

export const EventBreadcrumbRootItem = ({ onSelect }: RootItemProps) => {
	const nameClassName = createBemElement('event-breadcrumbs', 'name', onSelect ? null : 'disabled');

	return (
		<li className='event-breadcrumbs__item' key='root'>
			<i className='event-breadcrumbs__root-icon' onClick={onSelect} />
			<span className={nameClassName} onClick={onSelect}>
				Root events
			</span>
		</li>
	);
};
