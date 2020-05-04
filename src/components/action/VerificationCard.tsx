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
import '../../styles/action.scss';
import SplashScreen from '../SplashScreen';

interface VerificationCardProps {
    verification: EventAction;
    isSelected: boolean;
    isTransparent: boolean;
    parentActionId: number;
}

const VerificationCard = ({
	verification, isSelected, isTransparent, parentActionId,
}: VerificationCardProps) => {
	const {
		body,
		eventType,
		eventId,
	} = verification;
	const { status } = body;
	const className = createStyleSelector(
		'ac-body__verification',
		status,
		isSelected ? 'selected' : null,
		isTransparent && !isSelected ? 'transparent' : null,
	);

	const key = keyForVerification(parentActionId, eventId as any);

	return (
		<div className="action-card">
			<div className={className}>
				<div className="ac-header__title ac-body__verification-title-wrapper">
					<div className="ac-header__name">
						<div className="ac-header name-element" title={eventType}>
							{eventType}
						</div>
					</div>
				</div>
				<VerificationTable
					keyPrefix={key}
					actionId={parentActionId}
					messageId={eventId as any}
					stateKey={`${key}-nodes`}
					params={body}
					status={status as StatusType}/>
			</div>
		</div>
	);
};

export default VerificationCard;
