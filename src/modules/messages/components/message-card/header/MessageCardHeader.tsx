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
import clsx from 'clsx';
import { EventMessage, MessageViewType } from 'models/EventMessage';
import { formatTime, timestampToNumber } from 'helpers/date';
import CardDisplayType from 'models/util/CardDisplayType';
import Checkbox from 'components/util/Checkbox';
import { IconButton } from 'components/buttons/IconButton';
import { Chip } from 'components/Chip';
import { BookmarkIcon } from 'components/icons/BookmarkIcon';
import { AttachedMessagesIcon } from 'components/icons/AttachedMessagesIcon';
import { MessageIcon } from 'components/icons/MessageIcon';
import { MessageExpandIcon } from 'components/icons/MessageExpandIcon';
import { getSubsequence } from '../../../helpers/message';
import MessageCardTools, { MessageCardToolsProps } from '../menu/MessageCardTools';
import { Session } from './Session';

export interface MessageInfoProps {
	message: EventMessage;
	viewType?: MessageViewType;
	setViewType?: (id: string, vt: MessageViewType) => void;
	isBookmarked?: boolean;
	toggleMessagePin?: () => void;
	isAttached?: boolean;
	isExport?: boolean;
	isExported?: boolean;
	isExpanded?: boolean;
	setIsExpanded?: (state: boolean) => void;
	addMessageToExport?: (message: EventMessage) => void;
	displayType?: CardDisplayType;
	isScreenshotMsg?: boolean;
	onClick?: (message: EventMessage) => void;
}

export const MessageCardHeader = React.memo((props: MessageInfoProps & MessageCardToolsProps) => {
	const {
		message,
		viewType,
		setViewType,
		addMessageToExport,
		isBookmarked = false,
		isAttached,
		isExport,
		isExported,
		isExpanded,
		setIsExpanded,
		displayType = CardDisplayType.FULL,
		toggleMessagePin,
		onClick,
	} = props;
	const { timestamp, sessionId, direction } = message;

	const formattedTimestamp = formatTime(timestampToNumber(timestamp));

	const parsedMessage = message.parsedMessages ? message.parsedMessages[0] : undefined;
	const subsequence = parsedMessage && getSubsequence(parsedMessage);

	const changeExpandState = () => {
		if (setIsExpanded) {
			setIsExpanded(!isExpanded);
		}
	};
	const handleClick = () => {
		if (onClick) {
			onClick(message);
		}
	};

	return (
		<div className='mc-header mc-header__info' onClick={handleClick}>
			{isExport && isExported !== undefined && addMessageToExport && (
				<Checkbox checked={isExported} onChange={() => addMessageToExport(message)} />
			)}
			<Chip className='mc-header__icons'>
				<MessageIcon />
				{isBookmarked && <BookmarkIcon isPinned={isBookmarked} />}
				{isAttached && <AttachedMessagesIcon />}
			</Chip>
			{displayType === CardDisplayType.FULL && (
				<Chip className='mc-header__timestamp' title={`Timestamp: ${formattedTimestamp}`}>
					{timestamp && formattedTimestamp}
				</Chip>
			)}
			<Session sessionId={sessionId} direction={direction} />
			{displayType === CardDisplayType.FULL && <Chip title={message.id}>{message.id}</Chip>}

			{typeof subsequence === 'number' &&
				displayType === CardDisplayType.FULL &&
				message.parsedMessages && <Chip>{subsequence}</Chip>}
			{displayType === CardDisplayType.FULL && message.parsedMessages && (
				<Chip title={`Name: ${message.parsedMessages[0].message.metadata.messageType}`}>
					{message.parsedMessages[0].message.metadata.messageType}
				</Chip>
			)}
			<div className='mc-header__buttons'>
				<MessageCardTools
					message={message}
					toggleMessagePin={toggleMessagePin}
					isBookmarked={isBookmarked}
					parsedMessage={parsedMessage}
					isScreenshotMsg={props.isScreenshotMsg}
					viewType={viewType}
					setViewType={setViewType}
				/>
				{message.parsedMessages && setIsExpanded && (
					<IconButton
						className={clsx('mc-header__button', { expanded: isExpanded })}
						onClick={changeExpandState}>
						<MessageExpandIcon />
					</IconButton>
				)}
			</div>
		</div>
	);
});

MessageCardHeader.displayName = 'MessageCardHeader';
