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
import { EventMessage, MessageViewType } from '../../../../models/EventMessage';
import { createStyleSelector, createBemBlock } from '../../../../helpers/styleCreators';
import { formatTime, timestampToNumber } from '../../../../helpers/date';
import { getHashCode } from '../../../../helpers/stringHash';
import MessageCardTools, { MessageCardToolsProps } from '../MessageCardTools';
import { Chip } from '../../../Chip';

export interface MessageInfoProps {
	message: EventMessage;
	onTimestampMouseEnter?: () => void;
	onTimestampMouseLeave?: () => void;
	viewType: MessageViewType;
	setViewType: (vt: MessageViewType) => void;
	isBookmarked?: boolean;
	isEmbedded?: boolean;
	isScreenshotMsg: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
}

export const MessageCardHeader = React.memo((props: MessageInfoProps & MessageCardToolsProps) => {
	const {
		message,
		viewType,
		setViewType,
		onTimestampMouseEnter,
		onTimestampMouseLeave,
		isBookmarked,
		isEmbedded,
		messageCardToolsConfig,
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

	return (
		<div className='mc-header__info'>
			{!isEmbedded && isBookmarked && <div className={bookmarkIconClass} />}
			<Chip
				text={timestamp && formattedTimestamp}
				additionalClassName={'mc-header__timestamp'}
				title={`Timestamp: ${formattedTimestamp}`}
				onMouseEnter={onTimestampMouseEnter}
				onMouseLeave={onTimestampMouseLeave}
			/>
			<Chip title={`Session: ${sessionId}`}>
				<span className={sessionClass} style={sessionArrowStyle}></span>
				<span>{sessionId}</span>
			</Chip>
			<Chip text={message.id} />
			<Chip text={message.parsedMessages?.[0].message.metadata.id.subsequence[0]} />
			<Chip
				text={message.parsedMessages?.[0].message.metadata.messageType}
				title={
					message.parsedMessages?.[0].message.metadata.messageType &&
					`Name: ${message.parsedMessages?.[0].message.metadata.messageType}`
				}
			/>
			<div className='message-card-tools__wrapper'>
				<MessageCardTools
					{...messageCardToolsConfig}
					parsedMessage={message.parsedMessages?.[0]}
					isScreenshotMsg={props.isScreenshotMsg}
					viewType={viewType}
					setViewType={setViewType}
				/>
			</div>
		</div>
	);
});

MessageCardHeader.displayName = 'MessageCardHeader';

const HUE_SEGMENTS_COUNT = 36;

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}
