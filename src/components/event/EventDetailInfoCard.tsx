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
import { EventIdNode } from '../../stores/EventWindowStore';
import useCachedEvent, { useEventSubNodes } from '../../hooks/useCachedEvent';
import SplashScreen from '../SplashScreen';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import PanelArea from '../../util/PanelArea';
import { formatTime, getElapsedTime, getTimestampAsNumber } from '../../helpers/date';
import { getEventStatus } from '../../helpers/event';
import { getMinifiedStatus } from '../../helpers/action';
import { Chip } from '../Chip';
import EventBodyCard from './EventBodyCard';
import ErrorBoundary from '../util/ErrorBoundary';

interface Props {
	idNode: EventIdNode;
	isMinified?: boolean;
}

function EventDetailInfoCard({ idNode, isMinified = false }: Props) {
	const event = useCachedEvent(idNode);
	const subEvents = useEventSubNodes(idNode);

	if (!event) {
		return <SplashScreen/>;
	}

	const {
		startTimestamp,
		endTimestamp,
		attachedMessageIds,
		eventType,
		eventName,
		body,
		eventId,
	} = event;

	const status = getEventStatus(event);

	const rootClassName = createBemBlock(
		'action-card',
		status,
		'selected',
	);

	const headerClassName = createBemBlock(
		'ac-header',
		PanelArea.P100,
		status,
	);

	const headerTitleElemClassName = createBemElement(
		'ac-header',
		'name-element',
	);

	const elapsedTime = endTimestamp && startTimestamp
		? getElapsedTime(startTimestamp, endTimestamp)
		: null;

	return (
		<div style={{ overflow: 'auto', height: '100%' }}>
			<div className={rootClassName}>
				<div className={headerClassName}>
					<div className="ac-header__title">
						<div className="ac-header__name">
							<div className={headerTitleElemClassName} title={eventType || eventName}>
								{eventType || eventName}
							</div>
						</div>
					</div>
					{
						startTimestamp && !isMinified && (
							<div className="ac-header__start-time">
								<div className="ac-header__time-label">Start</div>
								<div className="ac-header__time-value">
									{formatTime(getTimestampAsNumber(startTimestamp))}
								</div>
							</div>
						)
					}
					{
						endTimestamp && !isMinified && (
							<div className="ac-header__start-time ac-header__end-time">
								<div className="ac-header__time-label">Finish</div>
								<div className="ac-header__time-value">
									{formatTime(getTimestampAsNumber(endTimestamp))}
								</div>
							</div>
						)
					}
					{
						elapsedTime && !isMinified && (
							<div className="ac-header__elapsed-time">
								<span>{elapsedTime}</span>
							</div>
						)
					}
					<div className="ac-header__controls">
						<div className="ac-header__status">
							{
								isMinified
									? getMinifiedStatus(status)
									: status.toUpperCase()
							}
						</div>
						{
							attachedMessageIds.length > 0 ? (
								<div className="ac-header__chips">
									<Chip text={attachedMessageIds.length.toString()}/>
								</div>
							) : null
						}
					</div>
				</div>
				<div className="ac-header__id">
					{eventId}
				</div>
				<ErrorBoundary fallback={<BodyFallback body={body}/>}>
					{
						Array.isArray(event.body)
							? event.body.map((bodyElement, index) => (
								<EventBodyCard body={bodyElement} parentEvent={event} key={index}/>
							))
							: <EventBodyCard body={event.body} parentEvent={event}/>
					}
				</ErrorBoundary>
			</div>
		</div>
	);
}

function BodyFallback({ body }: { body: any }) {
	if (!body) return null;

	return (
		<div style={{ overflow: 'auto', marginTop: '15px' }}>
			<pre>
				{body && JSON.stringify(body, null, 4)}
			</pre>
		</div>
	);
}

export default observer(EventDetailInfoCard);
