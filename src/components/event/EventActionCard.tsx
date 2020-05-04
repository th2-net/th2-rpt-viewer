/* eslint-disable no-lone-blocks */
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
import { createBemBlock, createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getMinifiedStatus } from '../../helpers/action';
import { StatusType } from '../../models/Status';
import SplashScreen from '../SplashScreen';
import { useOnScreen } from '../../hooks/useOnScreen';

interface Props {
    panelArea: PanelArea;
	event: EventAction;
	onSelect: (event: EventAction) => void;
	loadSubNodes: (event: EventAction, path: string[]) => void;
	isMinified?: boolean;
	isSelected?: boolean;
	loadingSubNodes?: boolean;
	path?: string[];
	expandNode: (expandPath: string[], event: EventAction) => void;
	expandPath: string[];
}

export default function EventActionCard({
	event,
	onSelect,
	isMinified = false,
	isSelected = false,
	loadSubNodes,
	path = [],
	expandPath,
	panelArea,
}: Props) {
	const {
		eventName,
		startTimestamp,
		endTimestamp,
		successful,
		attachedMessageIds,
		eventType,
		body,
	} = event;

	const rootRef = React.useRef<any>();

	const onScreen = useOnScreen(rootRef, '0px');

	React.useEffect(() => {
		if (onScreen && event.parentEventId !== null && !event.subNodes) {
			loadSubNodes(event, path);
		}
	}, [onScreen]);

	const isExpanded = expandPath.includes(event.eventId);

	// eslint-disable-next-line no-nested-ternary
	const status = eventType === 'verification'
		? body.status
		: successful ? 'PASSED' : 'FAILED';

	const rootClassName = createBemBlock(
		'action-card',
		status,
		'root',
		isSelected ? 'selected' : null,
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


	return (
		<div
			className={rootClassName}
			onClick={() => onSelect(event)}
			ref={rootRef}>
			<div className={headerClassName}>
				<div className="ac-header__title">
					<div className="ac-header__name">
						<div className={headerTitleElemClassName} title={eventName}>
							{eventName}
						</div>
					</div>
				</div>
				{
					event.parentEventId === null && startTimestamp && !isMinified && (
						<div className="ac-header__start-time">
							<div className="ac-header__time-label">Start</div>
							<div className="ac-header__time-value">
								{formatTime(new Date(startTimestamp.epochSecond * 1000).toString())}
							</div>
						</div>
					)
				}
				{
					event.parentEventId === null && endTimestamp && !isMinified && (
						<div className="ac-header__start-time ac-header__end-time">
							<div className="ac-header__time-label">Finish</div>
							<div className="ac-header__time-value">
								{formatTime(new Date(endTimestamp.epochSecond * 1000).toString())}
							</div>
						</div>
					)
				}
				{
					event.parentEventId === null && elapsedTime && !isMinified
					&& <div className="ac-header__elapsed-time">
						{elapsedTime}
					</div>
				}
				<div className="ac-header__controls">
					{event.parentEventId === null
					&& !event.subNodes
					&& isExpanded
						&& <div className="ac-header__loader">
							<SplashScreen />
						</div>}
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
		</div>
	);
}
