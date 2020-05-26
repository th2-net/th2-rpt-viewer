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
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { createBemBlock } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getMinifiedStatus } from '../../helpers/action';
import { getEventStatus } from '../../helpers/event';
import CardDisplayType from '../../util/CardDisplayType';
import { Chip } from '../Chip';
import '../../styles/events.scss';

interface Props {
	displayType?: CardDisplayType;
	event: EventAction;
	onSelect: () => void;
	isSelected?: boolean;
	childrenCount?: number | null;
}

function EventCardHeader({
	 displayType = CardDisplayType.MINIMAL,
	 event,
	 onSelect,
	 isSelected = false,
	 childrenCount,
}: Props) {
	const {
		eventName,
		startTimestamp,
		endTimestamp,
	} = event;

	const status = getEventStatus(event);

	const rootClassName = createBemBlock(
		'event-header-card',
		status,
		displayType,
		isSelected ? 'selected' : null,
	);

	return (
		<div
			className={rootClassName}
			onClick={() => onSelect()}>
			{
				displayType !== CardDisplayType.STATUS_ONLY ? (
					<div className='event-header-card__title' title={eventName}>
						{eventName}
					</div>
				) : null
			}
			{
				displayType === CardDisplayType.FULL && event.parentEventId === null && startTimestamp && (
					<div className="ac-header__start-time">
						<div className="ac-header__time-label">Start</div>
						<div className="ac-header__time-value">
							{formatTime(getTimestampAsNumber(startTimestamp))}
						</div>
					</div>
				)
			}
			{
				displayType === CardDisplayType.FULL && event.parentEventId === null && endTimestamp && (
					<div className="ac-header__start-time ac-header__end-time">
						<div className="ac-header__time-label">Finish</div>
						<div className="ac-header__time-value">
							{formatTime(getTimestampAsNumber(endTimestamp))}
						</div>
					</div>
				)
			}
			{
				displayType !== CardDisplayType.STATUS_ONLY
					&& childrenCount !== undefined
					&& childrenCount !== 0 ? (
						<div className="ac-header__chips">
							<Chip
								isLoading={childrenCount === null}
								text={childrenCount ?? ''}/>
						</div>
					) : null
			}
			<div className="event-header-card__status">
				{getMinifiedStatus(status)}
			</div>
		</div>
	);
}

export default observer(EventCardHeader);
