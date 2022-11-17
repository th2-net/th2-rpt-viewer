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
import { EventMessage, MessageViewType } from 'models/EventMessage';
import { createBemBlock } from 'helpers/styleCreators';
import { formatTime, timestampToNumber } from 'helpers/date';
import CardDisplayType from 'models/util/CardDisplayType';
import Checkbox from 'components/util/Checkbox';
import { Chip } from 'components/Chip';
import { getSubsequence } from '../../../helpers/message';
import MessageCardTools, { MessageCardToolsProps } from '../MessageCardTools';
import { Session } from './Session';

export interface MessageInfoProps {
	message: EventMessage;
	addMessageToExport?: (message: EventMessage) => void;
	viewType?: MessageViewType;
	setViewType: (id: string, vt: MessageViewType) => void;
	isBookmarked?: boolean;
	isAttached?: boolean;
	isHighlighted?: boolean;
	isExport?: boolean;
	isExported?: boolean;
	displayType: CardDisplayType;
	isScreenshotMsg?: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
}

export const MessageCardHeader = React.memo((props: MessageInfoProps & MessageCardToolsProps) => {
	const {
		message,
		viewType,
		setViewType,
		addMessageToExport,
		isBookmarked,
		isAttached,
		isHighlighted,
		isExport,
		isExported,
		displayType,
		messageCardToolsConfig,
	} = props;
	const { timestamp, sessionId, direction } = message;

	const headerClass = createBemBlock('mc-header__info', isHighlighted ? 'highlighted' : null);

	const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : 'hidden');

	const formattedTimestamp = formatTime(timestampToNumber(timestamp));

	const parsedMessage = message.parsedMessages ? message.parsedMessages[0] : undefined;
	const subsequence = parsedMessage && getSubsequence(parsedMessage);

	return (
		<div className={headerClass}>
			{isExport && isExported !== undefined && addMessageToExport && (
				<Checkbox checked={isExported} onChange={() => addMessageToExport(message)} />
			)}
			<Chip className='mc-header__icons'>
				<div className='mc-header__message-icon' />
				{isBookmarked && <div className={bookmarkIconClass} />}
				{isAttached && <div className='mc-header__attached-icon' />}
			</Chip>
			{displayType === CardDisplayType.FULL && (
				<Chip className='mc-header__timestamp' title={`Timestamp: ${formattedTimestamp}`}>
					{timestamp && formattedTimestamp}
				</Chip>
			)}
			<Session sessionId={sessionId} direction={direction} />
			{displayType === CardDisplayType.FULL && <Chip>{message.id}</Chip>}

			{typeof subsequence === 'number' &&
				displayType === CardDisplayType.FULL &&
				message.parsedMessages && <Chip>{subsequence}</Chip>}
			{displayType === CardDisplayType.FULL && message.parsedMessages && (
				<Chip title={`Name: ${message.parsedMessages[0].message.metadata.messageType}`}>
					{message.parsedMessages[0].message.metadata.messageType}
				</Chip>
			)}
			<div className='message-card-tools__wrapper'>
				<MessageCardTools
					{...messageCardToolsConfig}
					parsedMessage={parsedMessage}
					isScreenshotMsg={props.isScreenshotMsg}
					viewType={viewType}
					setViewType={setViewType}
				/>
			</div>
		</div>
	);
});

MessageCardHeader.displayName = 'MessageCardHeader';
