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
import { createBemBlock, createStyleSelector, createBemElement } from '../../helpers/styleCreators';
import { formatTime, timestampToNumber } from '../../helpers/date';
import { getEventStatus } from '../../helpers/event';
import EventBodyCard from './EventBodyCard';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { useSelectedStore, useWorkspaceEventStore } from '../../hooks';

interface Props {
	node: EventTreeNode;
	event: EventAction | null;
	eventTreeNode: EventTreeNode;
	childrenCount?: number;
	children?: React.ReactNode;
}

function EventDetailInfoCard(props: Props) {
	const selectedStore = useSelectedStore();
	const eventStore = useWorkspaceEventStore();

	const { event, eventTreeNode, node, children } = props;
	const [isStatusShown, setIsStatusShown] = React.useState(false);
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	if (!event) {
		return <SplashScreen />;
	}

	const { startTimestamp, endTimestamp, eventType, eventName, body, eventId } = event;
	const { isUnknown } = node;

	const status = isUnknown ? 'unknown' : getEventStatus(event);
	const startTimestampValue = startTimestamp && timestampToNumber(startTimestamp);
	const endTimestampValue = endTimestamp && timestampToNumber(endTimestamp);

	const isBookmarked =
		selectedStore.bookmarkedEvents.findIndex(
			bookmarkedEvent => bookmarkedEvent.id === event.eventId,
		) !== -1;

	function showStatus() {
		setIsStatusShown(!isStatusShown);
	}

	function onEventPin() {
		if (event === null) return;

		selectedStore.toggleEventPin(node);
	}

	function onMouseEnter() {
		if (!isUnknown) {
			hoverTimeout.current = setTimeout(() => {
				eventStore.setHoveredEvent(eventTreeNode);
			}, 600);
		}
	}

	function onMouseLeave() {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		eventStore.setHoveredEvent(null);
	}

	const cardClassName = createStyleSelector('event-detail-info__event-card', 'event-card', status);
	const statusClassName = createBemElement(
		'event-card',
		'status-label',
		isStatusShown ? null : 'closed',
	);
	const bookmarkButtonClassName = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : null);

	return (
		<div className='event-detail-info'>
			{children}
			<div className={cardClassName}>
				<div className='event-card__status'>
					<div
						className='event-status-icon active'
						onMouseEnter={showStatus}
						onMouseLeave={showStatus}
					/>
					<div className={statusClassName}>{status.toUpperCase()}</div>
				</div>
				<div className='event-card__info'>
					<div className='event-card__header'>
						<div className='event-card__title' title={eventName}>
							{eventName}
						</div>
						<div className='event-card__controls'>
							{eventType && <span className='event-card__event-type'>{eventType}</span>}
						</div>
					</div>
					<div className='event-card__body'>
						<div className='event-card__id'>{eventId}</div>
						<div
							className='event-card__timestamp'
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}>
							{formatTime(startTimestampValue)}
							{endTimestampValue && endTimestampValue !== startTimestampValue ? (
								<> &ndash; {formatTime(endTimestampValue)}</>
							) : null}
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
