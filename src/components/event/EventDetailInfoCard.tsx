/* eslint-disable react/no-children-prop */
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
import SplashScreen from '../SplashScreen';
import { createBemBlock } from '../../helpers/styleCreators';
import { formatTime, getElapsedTime, getTimestampAsNumber } from '../../helpers/date';
import { getEventStatus } from '../../helpers/event';
import { Chip } from '../Chip';
import EventBodyCard from './EventBodyCard';
import { EventAction } from '../../models/EventAction';

interface Props {
	event: EventAction | null;
	childrenCount?: number;
	rootStyle?: React.CSSProperties;
}

function EventDetailInfoCard(props: Props) {
	const { event, childrenCount = 0, rootStyle = {} } = props;

	if (!event) {
		return <SplashScreen />;
	}

	const { startTimestamp, endTimestamp, eventType, eventName, body, eventId, batchId } = event;

	const status = getEventStatus(event);

	const rootClassName = createBemBlock('event-detail-card', status);

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

	return (
		<div className={rootClassName} style={rootStyle}>
			<div className='event-detail-card__header'>
				<div className='event-detail-card__title' title={eventType || eventName}>
					{eventType || eventName}
				</div>
				<div className='event-detail-card__controls'>
					{elapsedTime && <span className='event-detail-card__time'>{elapsedTime}</span>}
					<span className='event-detail-card__separator' />
					<span className='event-detail-card__status'>{status.toUpperCase()}</span>
					{childrenCount > 0 ? <Chip text={childrenCount.toString()} /> : null}
				</div>
				<div className='event-detail-card__timestamp'>
					{startTimestamp && (
						<>
							<div className='event-detail-card__timestamp-label'>Start</div>
							<div className='event-detail-card__timestamp-value'>
								{formatTime(getTimestampAsNumber(startTimestamp))}
							</div>
						</>
					)}
					{endTimestamp && (
						<>
							<div className='event-detail-card__timestamp-label'>Finish</div>
							<div className='event-detail-card__timestamp-value'>
								{formatTime(getTimestampAsNumber(endTimestamp))}
							</div>
						</>
					)}
				</div>
				<div className='event-detail-card__id'>{`${batchId ? `${batchId}:` : ''}${eventId}`}</div>
			</div>
			<div className='event-detail-card__body'>
				<div className='event-detail-card__body-list'>
					{Array.isArray(body) ? (
						body.map((bodyPayloadItem, index) => (
							<EventBodyCard
								key={`body-${eventId}-${index}`}
								body={bodyPayloadItem}
								parentEvent={event}
							/>
						))
					) : (
						<EventBodyCard key={eventId} body={body} parentEvent={event} />
					)}
				</div>
			</div>
		</div>
	);
}

export default EventDetailInfoCard;
