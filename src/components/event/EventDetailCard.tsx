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
import PanelArea from '../../util/PanelArea';
import { formatTime, getElapsedTime, getTimestampAsNumber } from '../../helpers/date';
import { Chip } from '../Chip';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getMinifiedStatus } from '../../helpers/action';
import { StatusType } from '../../models/Status';
import ParamsTable from './ParamsTable';
import { extractParams } from '../../helpers/tables';
import { CustomTable } from './CustomTable';
import ErrorBoundary from '../util/ErrorBoundary';

interface Props {
    panelArea: PanelArea;
	event: EventAction;
	isMinified?: boolean;
}

export default function EventDetailCard({
	event,
	isMinified = false,
}: Props) {
	const {
		startTimestamp,
		endTimestamp,
		successful,
		attachedMessageIds,
		eventType,
		eventName,
		body,
		eventId,
	} = event;

	const status = successful ? 'PASSED' : 'FAILED';

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
					elapsedTime && !isMinified
					&& <div className="ac-header__elapsed-time">
						<span>{elapsedTime}</span>
					</div>
				}
				<div className="ac-header__controls">
					<div className="ac-header__status">
						{
							isMinified
								? getMinifiedStatus(status as StatusType)
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
			<div style={{ padding: '0 15px' }}>
				<ErrorBoundary
					fallback={<EventCardBodyFallback body={body}/>}>
					<EventCardBody
						body={body}
						event={event} />
				</ErrorBoundary>
			</div>
		</div>
	);
}

interface EventCardBodyProps {
	body: any;
	event: EventAction;
}

const EventCardBody = ({
	body,
	event,
}: EventCardBodyProps) => {
	if (Array.isArray(body)) {
		const content: Array<React.ReactNode> = [];
		body.forEach(bodyEl => {
			switch (bodyEl.type) {
			case 'message':
				content.push(<div key="message">{bodyEl.data}</div>);
				break;
			case 'table':
				content.push(
					<CustomTable
						content={bodyEl.fields}
						key="table"/>,
				);
				break;
			default:
				break;
			}
		});
		return <div>{content}</div>;
	}

	if (!body?.fields) return null;

	const { fields, ...restBody } = body;

	return <>
		<div className="ac-body__item-title">
			Input parameters
		</div>
		<ParamsTable
			params={extractParams(body)}
			actionId={event.eventId as any}
			stateKey={`${event.eventId}-input-params-nodes`}
			name={event.eventName} />
		<div style={{ overflow: 'auto', marginTop: '15px' }}>
			<pre>
				{body && Object.keys(restBody).length > 0 && JSON.stringify(restBody, null, 4)}
			</pre>
		</div>
	</>;
};

const EventCardBodyFallback = ({ body }: any) => {
	if (!body) return null;

	return (
		<div style={{ overflow: 'auto', marginTop: '15px' }}>
			<pre>
				{body && JSON.stringify(body, null, 4)}
			</pre>
		</div>
	);
};
