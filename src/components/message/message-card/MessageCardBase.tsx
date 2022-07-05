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
import { isScreenshotMessage, EventMessage, ParsedMessage } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import { MessageCardToolsProps } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageHeader } from './MessageHeader';
import { useMessagesWorkspaceStore } from '../../../hooks';

export interface MessageCardBaseProps {
	message: EventMessage;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isExported?: boolean;
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
		isHighlighted,
		isSoftFiltered,
		isExported,
		isExpanded,
		isAttached,
		isBookmarked,
		toogleMessagePin,
		isEmbedded,
		sortOrderItems,
	}: MessageCardBaseProps) => {
		const { id, rawMessageBase64 } = message;

		const messagesStore = useMessagesWorkspaceStore();

		const [renderingMessages, setRenderingMessages] = React.useState<ParsedMessage[]>([]);

		const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : 'hidden');

		const rootClass = createBemBlock(
			'message-card-wrapper',
			isAttached ? 'attached' : null,
			isBookmarked ? 'pinned' : null,
			isHighlighted ? 'highlighted' : null,
			isSoftFiltered ? 'soft-filtered' : null,
			messagesStore.exportStore.isExport ? 'export-mode' : null,
			isExported ? 'exported' : null,
		);

		const addMessagesToExport = React.useCallback(
			() => messagesStore.exportStore.addMessageToExport(message),
			[messagesStore.exportStore.addMessageToExport],
		);

		const isScreenshotMsg = isScreenshotMessage(message);

		React.useEffect(() => {
			if (message.parsedMessages)
				isExpanded
					? setRenderingMessages(message.parsedMessages)
					: setRenderingMessages(Array.of(message.parsedMessages[0]));
		}, [isExpanded]);

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
			isScreenshotMsg,
			isEmbedded,
		};

		return (
			<div className={rootClass} onClick={addMessagesToExport}>
				{!isEmbedded && isBookmarked && <div className={bookmarkIconClass} />}
				<div className='message-card'>
					<MessageHeader
						{...messageCardToolsConfig}
						message={message}
						onTimestampMouseEnter={hoverMessage}
						onTimestampMouseLeave={unhoverMessage}
					/>
					{renderingMessages.map((parsedMessage, index) => (
						<div className='mc__body parsed-message' key={parsedMessage.id}>
							<div className='mc-body'>
								{index > 0 && (
									<MessageHeader
										{...messageCardToolsConfig}
										message={message}
										parsedMessage={parsedMessage}
									/>
								)}
								{isScreenshotMsg ? (
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
											messageBody={parsedMessage.message}
											message={parsedMessage}
										/>
									</div>
								)}
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
