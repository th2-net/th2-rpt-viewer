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

import { StatusIcon } from 'components/icons/StatusIcon';
import { getEventStatus } from 'helpers/event';
import { createBemElement } from 'helpers/styleCreators';
import { EventTreeNode } from 'models/EventAction';

interface Props {
	eventNode: EventTreeNode | 'root';
	isLast?: boolean;
	onSelect: () => void;
}

export default function EventBreadcrumbsItem(props: Props) {
	const { eventNode, isLast = false, onSelect } = props;

	const itemClassName = createBemElement(
		'event-breadcrumbs',
		'item',
		eventNode === 'root' ? 'root' : getEventStatus(eventNode).toLocaleLowerCase(),
		isLast ? 'last' : null,
	);

	const arrowClassName = createBemElement('event-breadcrumbs', 'item-arrow');

	const title = eventNode === 'root' ? 'Root Events' : eventNode.eventName;

	return (
		<div className={itemClassName}>
			{eventNode === 'root' ? (
				<i className='event-breadcrumbs__item-icon' />
			) : (
				<StatusIcon status={getEventStatus(eventNode)} />
			)}
			<div className='event-breadcrumbs__item-title' onClick={onSelect} title={title}>
				{title}
			</div>
			<i className={arrowClassName} />
		</div>
	);
}
