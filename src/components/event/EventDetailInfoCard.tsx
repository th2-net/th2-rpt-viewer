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
import SplashScreen from '../SplashScreen';
import { createBemBlock, createStyleSelector } from '../../helpers/styleCreators';
import { formatTime, getElapsedTime, timestampToNumber } from '../../helpers/date';
import { getEventStatus } from '../../helpers/event';
import { Chip } from '../Chip';
import EventBodyCard from './EventBodyCard';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { useSelectedStore } from '../../hooks';

interface Props {
	node: EventTreeNode;
	event: EventAction | null;
	childrenCount?: number;
	children?: React.ReactNode;
}

function EventDetailInfoCard(props: Props) {
	const selectedStore = useSelectedStore();

	const { event, childrenCount = 0, node, children } = props;

	if (!event) {
		return <SplashScreen />;
	}

	const { startTimestamp, endTimestamp, eventType, eventName, body, eventId } = event;

	const status = getEventStatus(event);

	const isBookmarked =
		selectedStore.bookmarkedEvents.findIndex(
			bookmarkedEvent => bookmarkedEvent.id === event.eventId,
		) !== -1;

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

	function onEventPin() {
		if (event === null) return;

		selectedStore.toggleEventPin(node);
	}

	const cardClassName = createStyleSelector('event-detail-info__event-card', 'event-card', status);

	const bookmarkButtonClassName = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : null);

	return (
		<div className='event-detail-info'>
			{children}
			<div className={cardClassName}>
				<div className='event-card__status'>
					<div className={`event-status-icon active`}></div>
				</div>
				<div className='event-card__info'>
					<div className='event-card__header'>
						<div className='event-card__title' title={eventName}>
							{eventName}
						</div>
						<div className='event-card__controls'>
							{eventType && <span className='event-card__event-type'>{eventType}</span>}
							{elapsedTime && <span className='event-card__time'>{elapsedTime}</span>}
							{childrenCount > 0 ? <Chip text={childrenCount.toString()} /> : null}
							<span className='event-card__status-label'>{status.toUpperCase()}</span>
						</div>
					</div>
					<div className='event-card__body'>
						<div className='event-card__id'>{eventId}</div>
						<div className='event-card__timestamp'>
							<div className='event-card__timestamp-item'>
								{startTimestamp && (
									<>
										<div className='event-card__timestamp-label'>Start</div>
										<div className='event-card__timestamp-value'>
											{formatTime(timestampToNumber(startTimestamp))}
										</div>
									</>
								)}
							</div>
							<div className='event-card__timestamp-item'>
								{endTimestamp && (
									<>
										<div className='event-card__timestamp-label'>Finish</div>
										<div className='event-card__timestamp-value'>
											{formatTime(timestampToNumber(endTimestamp))}
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className='event-card__bookmark'>
					<div className={bookmarkButtonClassName} onClick={onEventPin}></div>
				</div>
			</div>
			<div className='event-detail-info__list'>
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
	);
}

export default observer(EventDetailInfoCard);
