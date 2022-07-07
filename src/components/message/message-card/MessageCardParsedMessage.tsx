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
import { MessageViewType, EventMessage } from '../../../models/EventMessage';
import { MessageCardToolsProps } from './MessageCardTools';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import { MessageScreenshotZoom } from './MessageScreenshot';
import { isScreenshotMessage, ParsedMessage } from '../../../models/EventMessage';
import { ParsedMessageHeader } from './header/ParsedMessageHeader';

export interface ParsedMessageProps {
	message: EventMessage;
	parsedMessage: ParsedMessage;
	parsedMessageIndex: number;
	viewType: MessageViewType;
	setViewType: (vt: MessageViewType) => void;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
	rawMessageBase64: string | null;
}

export const MessageCardParsedMessage = React.memo((props: ParsedMessageProps) => {
	const {
		message,
		parsedMessage,
		parsedMessageIndex,
		viewType,
		setViewType,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
		rawMessageBase64,
	} = props;

	return (
		<div key={parsedMessage.id} className='parsed-message-wrapper'>
			{parsedMessageIndex > 0 && (
				<ParsedMessageHeader
					{...messageCardToolsConfig}
					message={message}
					parsedMessage={parsedMessage}
					isScreenshotMsg={isScreenshotMessage(parsedMessage)}
					viewType={viewType}
					setViewType={setViewType}
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
								viewType={viewType}
								messageBody={parsedMessage.message}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

MessageCardParsedMessage.displayName = 'MessageCardParsedMessage';