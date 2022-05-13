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
import { EventMessage, isScreenshotMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import MessageCardTools, { MessageCardToolsConfig } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageHeader } from './MessageHeader';

export interface MessageCardBaseProps {
	message: EventMessage;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isContentBeautified?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	isExported?: boolean;
	isExport?: boolean;
	sortOrderItems?: string[];
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
	addMessageToExport?: () => void;
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
		isHighlighted,
		isSoftFiltered,
		toogleMessagePin,
		isEmbedded,
		isExported,
		isExport,
		sortOrderItems,
		addMessageToExport,
	}: MessageCardBaseProps) => {
		const { id, bodyBase64, body } = message;

		const rootClass = createBemBlock(
			'message-card-wrapper',
			isAttached ? 'attached' : null,
			isBookmarked ? 'pinned' : null,
			isHighlighted ? 'highlighted' : null,
			isSoftFiltered ? 'soft-filtered' : null,
			isExport ? 'export-mode' : null,
			isExported ? 'exported' : null,
		);

		const bookmarkIconClass = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : 'hidden');

		const toggleViewType = (v: MessageViewType) => {
			setViewType(v);
		};

		const isScreenshotMsg = isScreenshotMessage(message);

		const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
			viewType,
			messageId: id,
			messageBody: body,
			isBeautified: viewType === MessageViewType.FORMATTED,
			rawContent: bodyBase64,
			isSelected: isAttached || false,
			sortOrderItems: sortOrderItems || [],
		};

		const messageCardToolsConfig: MessageCardToolsConfig = {
			message,
			messageViewType: viewType,
			toggleViewType,
			isBookmarked: isBookmarked || false,
			toggleMessagePin: toogleMessagePin || (() => null),
			isScreenshotMsg,
			isEmbedded,
		};

		return (
			<div className={rootClass} onClick={addMessageToExport}>
				{!isEmbedded && isBookmarked && <div className={bookmarkIconClass} />}
				<div className='message-card'>
					<div className='mc__mc-body mc-body'>
						<MessageHeader
							message={message}
							onTimestampMouseEnter={hoverMessage}
							onTimestampMouseLeave={unhoverMessage}
						/>
						{isScreenshotMsg ? (
							<div className='mc-body__screenshot'>
								<MessageScreenshotZoom
									src={
										typeof bodyBase64 === 'string'
											? `data:${message.messageType};base64,${message.bodyBase64}`
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
