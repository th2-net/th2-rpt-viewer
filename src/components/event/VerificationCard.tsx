/** ****************************************************************************
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
import { StatusType } from '../../models/Status';
import { createStyleSelector } from '../../helpers/styleCreators';
import { VerificationTable } from './VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import { EventAction } from '../../models/EventAction';
import { getElapsedTime, formatTime, getTimestampAsNumber } from '../../helpers/date';
import { getMinifiedStatus } from '../../helpers/action';
import { Chip } from '../Chip';
import '../../styles/action.scss';

interface VerificationCardProps {
    verification: EventAction;
    isSelected: boolean;
    isTransparent: boolean;
	parentActionId: number;
	isMinified?: boolean;
}

const VerificationCard = ({
	verification,
	parentActionId,
	isMinified = false,
}: VerificationCardProps) => {
	const {
		body,
		eventId,
		eventType,
		startTimestamp,
		endTimestamp,
		subNodes,
	} = verification;
	const { status } = body;

	const rootClassName = createStyleSelector(
		'action-card',
		status,
		'selected',
	);

	const bodyClassName = createStyleSelector(
		'ac-body__verification',
		status,
	);

	const key = keyForVerification(parentActionId, eventId);

	return (
		<div className={rootClassName}>
			<div className={bodyClassName}>
				<div className="ac-header verification">
					<div className="ac-header__title ac-body__verification-title-wrapper">
						<div className="ac-header__name">
							<div className="ac-header name-element" title={eventType}>
								{eventType}
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
						!isMinified
						&& <div className="ac-header__elapsed-time">
							<span>{getElapsedTime(startTimestamp, endTimestamp)}</span>
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
							subNodes && subNodes.length > 0 ? (
								<div className="ac-header__chips">
									<Chip text={subNodes.length.toString()}/>
								</div>
							) : null
						}
					</div>
				</div>
				<VerificationTable
					keyPrefix={key}
					actionId={parentActionId as any}
					messageId={eventId as any}
					stateKey={`${key}-nodes`}
					params={body}
					status={status as StatusType}/>
			</div>
		</div>
	);
};

export default VerificationCard;
