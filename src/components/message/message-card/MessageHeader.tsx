/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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
import { EventMessage } from '../../../models/EventMessage';
import { createStyleSelector } from '../../../helpers/styleCreators';
import { formatTime } from '../../../helpers/date';
import { getHashCode } from '../../../helpers/stringHash';

interface MessageInfoProps {
	message: EventMessage;
	onTimestampMouseEnter?: () => void;
	onTimestampMouseLeave?: () => void;
}

export const MessageHeader = React.memo((props: MessageInfoProps) => {
	const { message, onTimestampMouseEnter, onTimestampMouseLeave } = props;
	const { timestamp, sessionId, messageType, id, direction } = message;

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		display: 'inline-flex',
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	const formattedTimestamp = formatTime(timestamp);
	return (
		<div className='mc-header__info'>
			<span
				className='mc-header__value mc-header__timestamp'
				title={`Timestamp: ${formattedTimestamp}`}
				onMouseEnter={onTimestampMouseEnter}
				onMouseLeave={onTimestampMouseLeave}>
				{timestamp && formattedTimestamp}
			</span>
			<span className='mc-header__value sessionId-inline' title={`Session: ${sessionId}`}>
				{sessionId}
			</span>
			<span className='mc-header__value'>{id}</span>
			<span className={sessionClass} style={sessionArrowStyle}></span>
			<span className='mc-header__value messageType' title={messageType && `Name: ${messageType}`}>
				{messageType}
			</span>
		</div>
	);
});

MessageHeader.displayName = 'MessageHeader';

const HUE_SEGMENTS_COUNT = 36;

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}
