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
import { formatTime, getSecondsPeriod } from '../../helpers/date';
import { Chip } from '../Chip';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getMinifiedStatus } from '../../helpers/action';
import { StatusType } from '../../models/Status';
import ActionParameter from '../../models/ActionParameter';
import ParamsTable from '../action/ParamsTable';

interface Props {
    panelArea: PanelArea;
	event: EventAction;
	onSelect: (event: EventAction) => void;
	isMinified?: boolean;
}

export default function EventCard({
	event,
	isMinified = false,
	onSelect,
}: Props) {
	const {
		startTimestamp,
		endTimestamp,
		successful,
		attachedMessageIds,
		eventType,
		eventName,
		body,
	} = event;
	// eslint-disable-next-line no-nested-ternary
	const status = eventType === 'verification'
		? body.status
		: successful ? 'PASSED' : 'FAILED';

	const rootClassName = createBemBlock(
		'action-card',
		status,
		'root',
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

	const elapsedTime = (startTimestamp && endTimestamp)
		? getSecondsPeriod(new Date(startTimestamp.epochSecond * 1000), new Date(endTimestamp.epochSecond * 1000))
		: null;

	const getParameters = (): ActionParameter[] => {
		if (!body?.fields) return [];
		const { fields } = body;
		// eslint-disable-next-line no-shadow
		const extractParams = (fields: any): ActionParameter[] =>
			Object.keys(fields)
				.reduce((params, key) => {
					if (typeof fields[key] === 'string') {
						return [...params, createParam(key, fields[key], [])];
					}
					if (Array.isArray(fields[key])) {
						return [
							...params,
							...fields[key].map((fieldObj: any) =>
								createParam(
									key,
									Object.keys(fields[key]).length.toString(),
									extractParams(fieldObj),
								)),
						];
					}
					if (fields[key] === Object(fields[key])) {
						return [
							...params,
							createParam(key, Object.keys(fields[key]).length.toString(), extractParams(fields[key])),
						];
					}
					return params;
				}, [] as ActionParameter[]);

		const createParam = (
			name: string,
			value: string | undefined,
			subParameters: ActionParameter[],
		): ActionParameter => ({
			name,
			value,
			subParameters,
		});
		return extractParams(fields);
	};

	const {
		fields,
		...restBody
	} = body || {};

	return (
		<div className={rootClassName}>
			<div className={headerClassName}>
				<div className="ac-header__title">
					<div className="ac-header__name">
						<div className={headerTitleElemClassName} title={eventName}>
							{eventType || eventName}
						</div>
					</div>
				</div>
				{
					startTimestamp && !isMinified && (
						<div className="ac-header__start-time">
							<div className="ac-header__time-label">Start</div>
							<div className="ac-header__time-value">
								{formatTime(new Date(startTimestamp.epochSecond * 1000).toString())}
							</div>
						</div>
					)
				}
				{
					endTimestamp && !isMinified && (
						<div className="ac-header__start-time ac-header__end-time">
							<div className="ac-header__time-label">Finish</div>
							<div className="ac-header__time-value">
								{formatTime(new Date(endTimestamp.epochSecond * 1000).toString())}
							</div>
						</div>
					)
				}
				{
					elapsedTime && !isMinified
					&& <div className="ac-header__elapsed-time">
						{elapsedTime}
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
			<div style={{ padding: '0 15px' }}>
				{body?.fields
				&& <>
					<div className="ac-body__item-title">Input parameters</div>
					<ParamsTable
						params={getParameters()}
						actionId={event.eventId as any}
						stateKey={`${event.eventId}-input-params-nodes`}
						name={event.eventName} />
				</>}
				<div style={{ overflow: 'auto', marginTop: '15px' }}>
					<pre>
						{body && Object.keys(restBody).length > 0 && JSON.stringify(restBody, null, 4)}
					</pre>
				</div>

			</div>
		</div>
	);
}
