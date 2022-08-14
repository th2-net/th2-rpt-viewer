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

import { memo } from 'react';
import { MessageViewType, EventMessage } from 'models/EventMessage';
import { createBemBlock } from 'helpers/styleCreators';
import CardDisplayType from 'models/util/CardDisplayType';
import { MessageScreenshotZoom } from '../MessageScreenshot';
import { MessageCardToolsProps } from '../MessageCardTools';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from '../MessageCardViewTypeRenderer';
import { ParsedMessageHeader } from '../header/ParsedMessageHeader';

export interface MessageCardRawProps {
	message: EventMessage;
	viewType?: MessageViewType;
	setViewType: (vt: MessageViewType, id: string) => void;
	displayType: CardDisplayType;
	isScreenshotMsg: boolean;
	isHighlighted?: boolean;
	isDisplayRuleRaw: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
}

export const MessageCardRaw = memo((props: MessageCardRawProps) => {
	const {
		message,
		viewType,
		setViewType,
		displayType,
		isScreenshotMsg,
		isHighlighted,
		isDisplayRuleRaw,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
	} = props;

	const parsedMessageClass = createBemBlock('parsed-message', isHighlighted ? 'highlighted' : null);

	return (
		<div className='parsed-message-wrapper'>
			{message.parsedMessages && !isDisplayRuleRaw && (
				<ParsedMessageHeader
					messageCardToolsConfig={messageCardToolsConfig}
					isScreenshotMsg={false}
					rawMessageIndex={message.parsedMessages ? message.parsedMessages.length + 1 : undefined}
					viewType={viewType}
					setViewType={setViewType}
				/>
			)}

			<div className={parsedMessageClass}>
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
							<MessageCardViewTypeRenderer
								{...messageViewTypeRendererProps}
								viewType={viewType}
								displayType={displayType}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

MessageCardRaw.displayName = 'MessageCardRaw';
