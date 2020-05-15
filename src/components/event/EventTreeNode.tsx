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
import { observer, useAsObservableSource } from 'mobx-react-lite';
import PanelArea from '../../util/PanelArea';
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { Chip } from '../Chip';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { EventAction } from '../../models/EventAction';
import { getMinifiedStatus } from '../../helpers/action';
import { StatusType } from '../../models/Status';
import SplashScreen from '../SplashScreen';

interface Props {
    panelArea: PanelArea;
	event: EventAction;
	onSelect: (event: EventAction, path: string[]) => void;
	isMinified?: boolean;
	isSelected?: boolean;
	loadingSubNodes?: boolean;
	path: string[];
	isExpanded?: boolean;
}

function EventTreeNode({
	event,
	onSelect,
	path,
	isMinified = false,
	isSelected = false,
	isExpanded = false,
}: Props) {
	const {
		eventName,
		startTimestamp,
		endTimestamp,
		successful,
		eventType,
		body,
		subNodes,
	} = event;

	const parents = useAsObservableSource(path);

	const status = eventType === 'verification'
		? body.status
		: successful ? 'PASSED' : 'FAILED';

	const rootClassName = createBemBlock(
		'action-card',
		status,
		'root',
		isSelected || isExpanded ? 'selected' : null,
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

	return (
		<div
			className={rootClassName}
			onClick={() => onSelect(event, parents)}>
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
								{formatTime(getTimestampAsNumber(startTimestamp))}
							</div>
						</div>
					)
				}
				{
					event.parentEventId === null && endTimestamp && !isMinified && (
						<div className="ac-header__start-time ac-header__end-time">
							<div className="ac-header__time-label">Finish</div>
							<div className="ac-header__time-value">
								{formatTime(getTimestampAsNumber(endTimestamp))}
							</div>
						</div>
					)
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
						subNodes && subNodes.length > 0 ? (
							<div className="ac-header__chips">
								<Chip text={subNodes.length.toString()} />
							</div>
						) : null
					}
				</div>
			</div>
		</div>
	);
}

export default observer(EventTreeNode);
