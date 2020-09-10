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
import { observer } from 'mobx-react-lite';
import { Virtuoso } from 'react-virtuoso';
import { EventIdNode } from '../../stores/EventsStore';
import useCachedEvent from '../../hooks/useCachedEvent';
import SplashScreen from '../SplashScreen';
import { createBemBlock } from '../../helpers/styleCreators';
import { formatTime, getElapsedTime, getTimestampAsNumber } from '../../helpers/date';
import { getEventStatus } from '../../helpers/event';
import { Chip } from '../Chip';
import EventBodyCard from './EventBodyCard';
import TableEventCard from './table/TableEventCard';
import CardDisplayType from '../../util/CardDisplayType';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';

interface Props {
	idNode: EventIdNode;
	showSubNodes?: boolean;
}

function EventDetailInfoCard({ idNode, showSubNodes = false }: Props) {
	const eventWindowStore = useEventWindowStore();
	const event = eventWindowStore.selectedEvent;

	if (!event) {
		return <SplashScreen/>;
	}

	const {
		startTimestamp,
		endTimestamp,
		eventType,
		eventName,
		body,
		eventId,
	} = event;

	const status = getEventStatus(event);

	const rootClassName = createBemBlock(
		'event-detail-card',
		status,
	);

	const elapsedTime = endTimestamp && startTimestamp
		? getElapsedTime(startTimestamp, endTimestamp)
		: null;

	const renderItem = (index: number) => {
		if (showSubNodes && idNode.children && index < idNode.children.length) {
			const subEvent = idNode.children[index];

			return (
				<TableEventCard
					key={subEvent.id}
					idNode={subEvent}
					displayType={CardDisplayType.MINIMAL}/>
			);
		}

		const bodyIndex = showSubNodes && idNode.children ? index - idNode.children.length : index;
		const bodyElement = Array.isArray(body) ? body[bodyIndex] : body;

		if (!bodyElement) {
			return <></>;
		}

		return (
			<EventBodyCard body={bodyElement} parentEvent={event}/>
		);
	};

	const computeKey = (index: number) => {
		if (showSubNodes && idNode.children) {
			if (index < idNode.children.length) {
				return idNode.children[index].id;
			}

			return `body-${eventId}-${index - idNode.children.length}`;
		}

		return `body-${eventId}-${index}`;
	};

	return (
		<div className={rootClassName}>
			<div className='event-detail-card__header'>
				<div className='event-detail-card__title' title={eventType || eventName}>
					{eventType || eventName}
				</div>
				<div className="event-detail-card__controls">
					{
						elapsedTime && (
							<span className="event-detail-card__time">{elapsedTime}</span>
						)
					}
					<span className="event-detail-card__separator"/>
					<span className="event-detail-card__status">
						{status.toUpperCase()}
					</span>
					{
						idNode.children && idNode.children?.length > 0 ? (
							<Chip text={idNode.children.length.toString()}/>
						) : null
					}
				</div>
				<div className='event-detail-card__timestamp'>
					{
						startTimestamp && (
							<>
								<div className="event-detail-card__timestamp-label">Start</div>
								<div className="event-detail-card__timestamp-value">
									{formatTime(getTimestampAsNumber(startTimestamp))}
								</div>
							</>
						)
					}
					{
						endTimestamp && (
							<>
								<div className="event-detail-card__timestamp-label">Finish</div>
								<div className="event-detail-card__timestamp-value">
									{formatTime(getTimestampAsNumber(endTimestamp))}
								</div>
							</>
						)
					}
				</div>
				<div className="event-detail-card__id">
					{eventId}
				</div>
			</div>
			<div className='event-detail-card__body'>
				{
					showSubNodes ? (
						<Virtuoso
							style={{ height: '100%', width: '100%' }}
							className='event-detail-card__body-list'
							computeItemKey={computeKey}
							overscan={3}
							totalCount={
								(idNode.children?.length ?? 0) + (Array.isArray(body) ? body.length : +Boolean(body))
							}
							item={renderItem}/>

					) : (
						<div className='event-detail-card__body-list'>
							{
								Array.isArray(body)
									? body.map((bodyPayloadItem, index) => (
										<EventBodyCard
											key={`body-${eventId}-${index}`}
											body={bodyPayloadItem}
											parentEvent={event}/>
									))
									: <EventBodyCard key={eventId} body={body} parentEvent={event} />
							}
						</div>
					)
				}
			</div>
		</div>
	);
}

export default observer(EventDetailInfoCard);
