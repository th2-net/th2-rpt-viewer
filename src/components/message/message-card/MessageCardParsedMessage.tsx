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
import { MessageCardToolsProps } from './MessageCardTools';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import { ParsedMessage, MessageViewType, EventMessage } from '../../../models/EventMessage';
import { ParsedMessageHeader } from './header/ParsedMessageHeader';

export interface ParsedMessageProps {
	message: EventMessage;
	parsedMessage: ParsedMessage;
	parsedMessageIndex: number;
	viewType?: MessageViewType;
	setViewType: (vt: MessageViewType, id: string) => void;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
}

export const ParsedMessageComponent = React.memo((props: ParsedMessageProps) => {
	const {
		parsedMessage,
		parsedMessageIndex,
		viewType,
		setViewType,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
	} = props;

	return (
		<div key={parsedMessage.id} className='parsed-message-wrapper'>
			{parsedMessageIndex > 0 && (
				<ParsedMessageHeader
					messageCardToolsConfig={messageCardToolsConfig}
					parsedMessage={parsedMessage}
					isScreenshotMsg={false}
					viewType={viewType}
					setViewType={setViewType}
				/>
			)}
			<div className='parsed-message' key={parsedMessage.id}>
				<div className='mc-body'>
					<div className='mc-body__human'>
						<MessageCardViewTypeRenderer
							{...messageViewTypeRendererProps}
							viewType={viewType}
							messageBody={parsedMessage.message}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});

ParsedMessageComponent.displayName = 'ParsedMessageComponent';
