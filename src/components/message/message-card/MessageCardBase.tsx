/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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
import { createBemBlock } from '../../../helpers/styleCreators';
import { MessageScreenshotZoom } from './MessageScreenshot';
import {
	isScreenshotMessage,
	MessageViewType,
	EventMessageItem,
} from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import MessageCardTools, { MessageCardToolsConfig } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageHeader } from './MessageHeader';

export interface MessageCardBaseProps {
	message: EventMessageItem;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isContentBeautified?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
}

const MessageCardBase = React.memo(
	({
		message,
		viewType,
		setViewType,
		hoverMessage,
		unhoverMessage,
		isAttached,
		isBookmarked,
		toogleMessagePin,
		isEmbedded,
		sortOrderItems,
	}: MessageCardBaseProps) => {
		const { id, rawMessageBase64, parsedMessage } = message;

		const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : 'hidden');

		const toggleViewType = (v: MessageViewType) => {
			setViewType(v);
		};

		const isScreenshotMsg = isScreenshotMessage(message);

		const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
			viewType,
			messageId: id,
			messageBody: parsedMessage ? parsedMessage.message : null,
			isBeautified: viewType === MessageViewType.FORMATTED,
			rawContent: rawMessageBase64,
			isSelected: isAttached || false,
			sortOrderItems: sortOrderItems || [],
		};

		const messageCardToolsConfig: MessageCardToolsConfig = {
			message,
			parsedMessage,
			messageViewType: viewType,
			toggleViewType,
			isBookmarked: isBookmarked || false,
			toggleMessagePin: toogleMessagePin || (() => null),
			isScreenshotMsg,
			isEmbedded,
		};

		return (
			<div>
				{!isEmbedded && isBookmarked && <div className={bookmarkIconClass} />}
				<div className='message-card'>
					<div className='mc__mc-body mc-body'>
						<MessageHeader
							message={message}
							parsedMessage={parsedMessage}
							onTimestampMouseEnter={hoverMessage}
							onTimestampMouseLeave={unhoverMessage}
						/>
						{isScreenshotMsg ? (
							<div className='mc-body__screenshot'>
								<MessageScreenshotZoom
									src={
										typeof rawMessageBase64 === 'string'
											? `data:${parsedMessage?.message.metadata.messageType};base64,` +
											  `${message.rawMessageBase64}`
											: ''
									}
									alt={message.id}
								/>
							</div>
						) : (
							<div className='mc-body__human'>
								<MessageCardViewTypeRenderer {...messageViewTypeRendererProps} />
							</div>
						)}
					</div>
				</div>
				<MessageCardTools {...messageCardToolsConfig} />
			</div>
		);
	},
);

MessageCardBase.displayName = 'MessageCardBase';

export default MessageCardBase;
