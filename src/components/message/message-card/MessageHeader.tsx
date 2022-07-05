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
import { EventMessage, ParsedMessage } from '../../../models/EventMessage';
import { createStyleSelector, createBemBlock } from '../../../helpers/styleCreators';
import { formatTime, timestampToNumber } from '../../../helpers/date';
import { getHashCode } from '../../../helpers/stringHash';
import MessageCardTools, { MessageCardToolsProps } from './MessageCardTools';

interface MessageInfoProps {
	message: EventMessage;
	parsedMessage?: ParsedMessage;
	onTimestampMouseEnter?: () => void;
	onTimestampMouseLeave?: () => void;
	isBookmarked?: boolean;
	isEmbedded?: boolean;
}

export const MessageHeader = React.memo((props: MessageInfoProps & MessageCardToolsProps) => {
	const {
		message,
		parsedMessage,
		onTimestampMouseEnter,
		onTimestampMouseLeave,
		isBookmarked,
		isEmbedded,
	} = props;
	const { timestamp, sessionId, direction } = message;

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		display: 'inline-flex',
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : 'hidden');

	const formattedTimestamp = formatTime(timestampToNumber(timestamp));

	const messageCardToolsConfig: MessageCardToolsProps = {
		message,
		isBookmarked: props.isBookmarked || false,
		toggleMessagePin: props.toggleMessagePin || (() => null),
		isScreenshotMsg: props.isScreenshotMsg,
		isEmbedded: props.isEmbedded,
	};
	return (
		<div className='mc-header__info'>
			{parsedMessage ? (
				<>
					<span
						className='mc-header__value sessionId-inline'
						title={`Session: ${parsedMessage.message.metadata.id.sequence}`}>
						{parsedMessage.message.metadata.id.subsequence[0]}
					</span>
					<span
						className='mc-header__value messageType'
						title={
							parsedMessage.message.metadata.messageType &&
							`Name: ${parsedMessage.message.metadata.messageType}`
						}>
						{parsedMessage.message.metadata.messageType}
					</span>
					<div className='message-card-tools__wrapper'>
						<MessageCardTools {...messageCardToolsConfig} parsedMessage={parsedMessage} />
					</div>
				</>
			) : (
				<>
					{!isEmbedded && isBookmarked && <div className={bookmarkIconClass} />}

					<span
						className='mc-header__value mc-header__timestamp'
						title={`Timestamp: ${formattedTimestamp}`}
						onMouseEnter={onTimestampMouseEnter}
						onMouseLeave={onTimestampMouseLeave}>
						{timestamp && formattedTimestamp}
					</span>
					<div className='mc-header__value sessionId-inline' title={`Session: ${sessionId}`}>
						<span className={sessionClass} style={sessionArrowStyle}></span>
						<span>{sessionId}</span>
					</div>
					<span className='mc-header__value'>{message.id}</span>
					<span className='mc-header__value'>
						{message.parsedMessages?.[0].message.metadata.id.subsequence[0]}
					</span>
					<span
						className='mc-header__value messageType'
						title={
							message.parsedMessages?.[0].message.metadata.messageType &&
							`Name: ${message.parsedMessages?.[0].message.metadata.messageType}`
						}>
						{message.parsedMessages?.[0].message.metadata.messageType}
					</span>
					{message.parsedMessages && (
						<div className='message-card-tools__wrapper'>
							<MessageCardTools
								{...messageCardToolsConfig}
								parsedMessage={message.parsedMessages[0]}
							/>
						</div>
					)}
				</>
			)}
		</div>
	);
});

MessageHeader.displayName = 'MessageHeader';

const HUE_SEGMENTS_COUNT = 36;

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}
