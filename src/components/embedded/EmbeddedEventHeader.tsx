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

import { getElapsedTime } from 'modules/events/helpers/date';
import { formatTime } from '../../helpers/date';
import { createBemBlock } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getEventStatus } from '../../helpers/event';
import CardDisplayType from '../../models/util/CardDisplayType';

interface Props {
	displayType?: CardDisplayType;
	event: EventAction;
}

export default function EmbeddedEventHeader(props: Props) {
	const { displayType = CardDisplayType.MINIMAL, event } = props;
	const { eventId, eventName, eventType, startTimestamp, endTimestamp } = event;

	const status = getEventStatus(event);

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

	const rootClassName = createBemBlock('event-header-card', status, displayType);

	const iconClassName = createBemBlock('event-status-icon', status);

	return (
		<div className={rootClassName}>
			<div className={iconClassName} />
			{displayType !== CardDisplayType.STATUS_ONLY ? (
				<div className='event-header-card__title' title={eventName}>
					<span>{eventName}</span> <span>{eventId}</span>
				</div>
			) : null}
			{displayType !== CardDisplayType.STATUS_ONLY ? (
				<>
					{elapsedTime && <span className='event-header-card__elapsed-time'>{elapsedTime}</span>}
					<div className='event-header-card__time-label'>
						<span className='event-header-card__time-label-full'>{formatTime(startTimestamp)}</span>
					</div>
					{eventType && <span className='event-header-card__event-type'>{eventType}</span>}
				</>
			) : null}
		</div>
	);
}
