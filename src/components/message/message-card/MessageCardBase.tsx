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
import {
	isScreenshotMessage,
	EventMessage,
	MessageViewTypeConfig,
} from '../../../models/EventMessage';
import { MessageCardViewTypeRendererProps } from './MessageCardViewTypeRenderer';
import { MessageCardToolsProps } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageCardHeader, MessageInfoProps } from './header/MessageCardHeader';
import { ParsedMessageComponent } from './MessageCardParsedMessage';
import { defineViewTypeConfig } from '../../../helpers/message';
import { MessageCardRaw } from './raw/MessageCardRaw';

export interface MessageCardBaseProps {
	message: EventMessage;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	addMessagesToExport?: () => void;
	viewTypeConfig: MessageViewTypeConfig | MessageViewTypeConfig[];
	rawViewTypeConfig?: MessageViewTypeConfig;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isExported?: boolean;
	isExport?: boolean;
	isAttached?: boolean;
	isBookmarked?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
	isExpanded: boolean;
}

const MessageCardBase = React.memo(
	({
		message,
		hoverMessage,
		unhoverMessage,
		addMessagesToExport,
		viewTypeConfig,
		rawViewTypeConfig,
		isHighlighted,
		isSoftFiltered,
		isExported,
		isExport,
		isExpanded,
		isAttached,
		isBookmarked,
		toogleMessagePin,
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
			isBookmarked,
			toggleMessagePin: toogleMessagePin,
		};

		const messageInfoProps: MessageInfoProps = {
			message,
			viewType: defineViewTypeConfig(viewTypeConfig, 0).viewType,
			setViewType: defineViewTypeConfig(viewTypeConfig, 0).setViewType,
			onTimestampMouseEnter: hoverMessage,
			onTimestampMouseLeave: unhoverMessage,
			isBookmarked,
			isAttached,
			isScreenshotMsg: isScreenshotMessage(message.parsedMessages?.[0]),
			messageCardToolsConfig,
		};

		return (
			<div className={rootClass} onClick={addMessagesToExport}>
				<div className='message-card'>
					<MessageCardHeader {...messageInfoProps} />
					{message.parsedMessages
						?.filter((parsedMessage, index) => (isExpanded ? parsedMessage : index === 0))
						.map((parsedMessage, index) => (
							<ParsedMessageComponent
								key={index}
								message={message}
								parsedMessage={parsedMessage}
								parsedMessageIndex={index}
								viewType={defineViewTypeConfig(viewTypeConfig, index).viewType}
								setViewType={defineViewTypeConfig(viewTypeConfig, index).setViewType}
								messageCardToolsConfig={messageCardToolsConfig}
								messageViewTypeRendererProps={messageViewTypeRendererProps}
							/>
						))}
					{(!message.parsedMessages || isExpanded) && (
						<MessageCardRaw
							message={message}
							viewType={
								rawViewTypeConfig?.viewType || defineViewTypeConfig(viewTypeConfig).viewType
							}
							setViewType={
								rawViewTypeConfig?.setViewType || defineViewTypeConfig(viewTypeConfig).setViewType
							}
							messageCardToolsConfig={messageCardToolsConfig}
							messageViewTypeRendererProps={messageViewTypeRendererProps}
						/>
					)}
				</div>
			</div>
		);
	},
);

MessageCardBase.displayName = 'MessageCardBase';

export default MessageCardBase;
