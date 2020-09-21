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
import TimeAgo from 'react-timeago';
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { createBemBlock } from '../../helpers/styleCreators';
import { EventTreeNode } from '../../models/EventAction';
import { getEventStatus } from '../../helpers/event';
import CardDisplayType from '../../util/CardDisplayType';
import { Chip } from '../Chip';
import { getMinifiedStatus } from '../../helpers/action';
import SearchableContent from '../search/SearchableContent';

interface Props {
	displayType?: CardDisplayType;
	event: EventTreeNode;
	isRoot?: boolean;
	onSelect: () => void;
	isSelected?: boolean;
	childrenCount?: number | null;
	isFlatView?: boolean;
	parentsCount?: number;
}

function EventCardHeader({
	 displayType = CardDisplayType.MINIMAL,
	 event,
	 onSelect,
	 isSelected = false,
	 childrenCount,
	 isFlatView = false,
	 parentsCount = 0,
}: Props) {
	const {
		eventId,
		eventName,
		startTimestamp,
	} = event;

	const status = getEventStatus(event);
	const startTimestampValue = getTimestampAsNumber(startTimestamp);

	const rootClassName = createBemBlock(
		'event-header-card',
		status,
		displayType,
		isSelected ? 'selected' : null,
	);

	return (
		<div className={rootClassName} onClick={onSelect}>
			{
				isFlatView && parentsCount > 0
					? <Chip text={parentsCount.toString()}/>
					: null
			}
			{
				displayType !== CardDisplayType.STATUS_ONLY ? (
					<div className='event-header-card__title' title={eventName}>
						<SearchableContent content={eventName} eventId={eventId}/>
					</div>
				) : null
			}
			{
				displayType !== CardDisplayType.STATUS_ONLY ? (
					<div className="event-header-card__time-label">
						<span className="event-header-card__time-label-full">
							{formatTime(startTimestampValue)}
						</span>
						<span className="event-header-card__time-label-short">
							<TimeAgo date={startTimestampValue}/>
						</span>
					</div>
				) : null
			}
			{
				displayType !== CardDisplayType.STATUS_ONLY
					&& childrenCount !== undefined
					&& childrenCount !== 0 ? (
						<Chip
							isLoading={childrenCount === null}
							text={childrenCount ?? ''}/>
					) : null
			}
			<div className="event-header-card__status">
				{
					displayType === CardDisplayType.FULL
						? status.toUpperCase()
						: getMinifiedStatus(status)
				}
			</div>
		</div>
	);
}

export default observer(EventCardHeader);
