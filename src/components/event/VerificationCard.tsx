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
import { createStyleSelector, createBemBlock } from '../../helpers/styleCreators';
import { VerificationTable } from './VerificationTable';
import { keyForVerification } from '../../helpers/keys';
import { EventAction } from '../../models/EventAction';
import { getElapsedTime, formatTime, getTimestampAsNumber } from '../../helpers/date';
import { getMinifiedStatus } from '../../helpers/action';
import { Chip } from '../Chip';
import ErrorBoundary from '../util/ErrorBoundary';
import '../../styles/action.scss';
import PanelArea from '../../util/PanelArea';

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
		successful,
	} = verification;

	const verificationBody = body !== null
		? Array.isArray(body)
			? body.find(bodyEl => bodyEl.type === 'verification')
			: body
		: {};

	const status = verificationBody && verificationBody.status
		? verificationBody.status
		: successful ? 'PASSED' : 'FAILED';

	const rootClassName = createStyleSelector(
		'action-card',
		status,
		'selected',
	);

	const headerClassName = createBemBlock(
		'ac-header',
		PanelArea.P100,
		status,
	);

	const bodyClassName = createStyleSelector(
		'ac-body__verification',
		status,
	);

	const elapsedTime = endTimestamp && startTimestamp
		? getElapsedTime(startTimestamp, endTimestamp)
		: null;

	const key = keyForVerification(parentActionId, eventId);

	return (
		<div className={rootClassName}>
			<div className={bodyClassName}>
				<div className={headerClassName}>
					<div className="ac-header__title ac-body__verification-title-wrapper">
						<div className="ac-header__name">
							<div className="ac-header__name-element" title={eventType}>
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
							subNodes && subNodes.length > 0
							&& (
								<div className="ac-header__chips">
									<Chip text={subNodes.length.toString()}/>
								</div>
							)
						}
					</div>
				</div>
				<ErrorBoundary
					fallback={<VerificationCardBodyFallback body={verificationBody}/>}>
					<VerificationTable
						keyPrefix={key}
						actionId={parentActionId as any}
						messageId={eventId as any}
						stateKey={`${key}-nodes`}
						params={verificationBody}
						status={status as StatusType}/>
				</ErrorBoundary>

			</div>
		</div>
	);
};

export default VerificationCard;

const VerificationCardBodyFallback = ({ body }: any) => {
	if (!body) return null;

	return (
		<div style={{ overflow: 'auto', marginTop: '15px' }}>
			<pre>
				{body && JSON.stringify(body, null, 4)}
			</pre>
		</div>
	);
};
