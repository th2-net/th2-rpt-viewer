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

import clsx from 'clsx';
import { Button } from 'components/buttons/Button';
import { EventCardHeaderBase } from './EventCardHeader';
import { toEventTreeNode, isEmptyBody } from '../../helpers/event';
import { EventAction } from '../../models/Event';
import EventBodyCard from './EventBodyCard';

interface EventBookmarkComponentProps {
	event: EventAction;
	onClick: (event: EventAction) => void;
	isExpanded: boolean;
	toggleExpand: (id: string) => void;
	showCheckbox?: boolean;
	onSelect?: React.ChangeEventHandler<HTMLInputElement>;
	checked?: boolean;
}

export const ExpandableEventCard = (props: EventBookmarkComponentProps) => {
	const { event, onClick, isExpanded, toggleExpand, showCheckbox, checked, onSelect } = props;

	const isEmpty = isEmptyBody(event.body);

	return (
		<div className={clsx('event-search-item', { empty: isEmpty })}>
			<div className='event-search-item__header'>
				<EventCardHeaderBase
					event={toEventTreeNode(event)}
					onClick={() => onClick(event)}
					showCheckbox={showCheckbox}
					checked={checked}
					onSelect={onSelect}
				/>
			</div>
			{!isEmpty && (
				<div className='event-search-item__body'>
					{isExpanded && <EventBodyCard event={event} />}
					<div className='event-search-item__footer'>
						<Button variant='text' onClick={() => toggleExpand(event.eventId)}>
							{isExpanded ? 'Show less' : 'Show more'}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
