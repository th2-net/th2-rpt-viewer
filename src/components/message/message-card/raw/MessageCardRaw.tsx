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
import { MessageCardToolsProps } from '../MessageCardTools';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from '../MessageCardViewTypeRenderer';
import { MessageViewType, EventMessage } from '../../../../models/EventMessage';
import { ParsedMessageHeader } from '../header/ParsedMessageHeader';
import { MessageScreenshotZoom } from '../MessageScreenshot';

export interface MessageCardRawProps {
	message: EventMessage;
	viewType?: MessageViewType;
	setViewType: (vt: MessageViewType, messageId: string, parsedMessageId: string) => void;
	isScreenshotMsg: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
}

export const MessageCardRaw = React.memo((props: MessageCardRawProps) => {
	const {
		message,
		viewType,
		setViewType,
		isScreenshotMsg,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
	} = props;
	return (
		<div className='parsed-message-wrapper'>
			{message.parsedMessages && (
				<ParsedMessageHeader
					messageCardToolsConfig={messageCardToolsConfig}
					isScreenshotMsg={false}
					rawMessageIndex={message.parsedMessages ? message.parsedMessages.length + 1 : undefined}
					viewType={viewType}
					setViewType={setViewType}
				/>
			)}

			<div className='parsed-message'>
				<div className='mc-body'>
					{isScreenshotMsg ? (
						<div className='mc-body__screenshot'>
							<MessageScreenshotZoom
								src={
									typeof message.rawMessageBase64 === 'string'
										? `data:screenshot;base64,${message.rawMessageBase64}`
										: ''
								}
								alt={message.id}
							/>
						</div>
					) : (
						<div className='mc-body__human'>
							<MessageCardViewTypeRenderer {...messageViewTypeRendererProps} viewType={viewType} />
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

MessageCardRaw.displayName = 'MessageCardRaw';
