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
import { isScreenshotMessage, EventMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import { MessageCardToolsProps } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageHeader, MessageInfoProps } from './MessageHeader';
import { SavedMessageViewType } from '../../../stores/messages/SavedMessageViewType';

export interface MessageCardBaseProps {
	message: EventMessage;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	addMessagesToExport?: () => void;
	getSavedViewType?: (message: EventMessage, parsedMessageId: string) => SavedMessageViewType;
	viewType?: MessageViewType;
	viewTypes?: MessageViewType[];
	setViewType?: React.Dispatch<React.SetStateAction<MessageViewType>>;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isExported?: boolean;
	isExport?: boolean;
	isExpanded?: boolean;
	isAttached?: boolean;
	isBookmarked?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
}

const MessageCardBase = React.memo(
	({
		message,
		hoverMessage,
		unhoverMessage,
		addMessagesToExport,
		getSavedViewType,
		viewType,
		viewTypes,
		setViewType,
		isHighlighted,
		isSoftFiltered,
		isExported,
		isExport,
		isExpanded,
		isAttached,
		isBookmarked,
		toogleMessagePin,
		isEmbedded,
		sortOrderItems,
	}: MessageCardBaseProps) => {
		const { id, rawMessageBase64 } = message;

		const rootClass = createBemBlock(
			'message-card-wrapper',
			isAttached ? 'attached' : null,
			isBookmarked ? 'pinned' : null,
			isHighlighted ? 'highlighted' : null,
			isSoftFiltered ? 'soft-filtered' : null,
			isExport ? 'export-mode' : null,
			isExported ? 'exported' : null,
		);

		const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
			messageId: id,
			rawContent: rawMessageBase64,
			isSelected: isAttached || false,
			sortOrderItems: sortOrderItems || [],
		};

		const messageCardToolsConfig: MessageCardToolsProps = {
			message,
			isBookmarked: isBookmarked || false,
			toggleMessagePin: toogleMessagePin || (() => null),
			isEmbedded,
		};

		const messageInfoProps: MessageInfoProps = {
			message,
			viewType: viewTypes ? viewTypes[0] : viewType,
			setViewType,
			getSavedViewType,
			onTimestampMouseEnter: hoverMessage,
			onTimestampMouseLeave: unhoverMessage,
			isBookmarked: isBookmarked || false,
			isEmbedded,
			isScreenshotMsg: isScreenshotMessage(message.parsedMessages?.[0]),
		};

		return (
			<div className={rootClass} onClick={addMessagesToExport}>
				<div className='message-card'>
					<MessageHeader {...messageCardToolsConfig} {...messageInfoProps} />
					{message.parsedMessages
						?.filter((parsedMessage, index) => (isExpanded ? parsedMessage : index < 1))
						.map((parsedMessage, index) => (
							<div key={parsedMessage.id} className='parsed-message-wrapper'>
								{index > 0 && (
									<MessageHeader
										{...messageCardToolsConfig}
										message={message}
										parsedMessage={parsedMessage}
										isScreenshotMsg={isScreenshotMessage(parsedMessage)}
										viewType={viewTypes ? viewTypes[index] : viewType}
										setViewType={setViewType}
										getSavedViewType={getSavedViewType}
									/>
								)}
								<div className='parsed-message' key={parsedMessage.id}>
									<div className='mc-body'>
										{isScreenshotMessage(parsedMessage) ? (
											<div className='mc-body__screenshot'>
												<MessageScreenshotZoom
													src={
														typeof rawMessageBase64 === 'string'
															? `data:${parsedMessage.message.metadata.messageType};base64,` +
															  `${message.rawMessageBase64}`
															: ''
													}
													alt={message.id}
												/>
											</div>
										) : (
											<div className='mc-body__human'>
												<MessageCardViewTypeRenderer
													{...messageViewTypeRendererProps}
													viewType={viewTypes ? viewTypes[index] : viewType}
													messageBody={parsedMessage.message}
												/>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
				</div>
			</div>
		);
	},
);

MessageCardBase.displayName = 'MessageCardBase';

export default MessageCardBase;
