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
import { ParsedMessage, MessageViewType } from 'models/EventMessage';
import { createBemBlock } from 'helpers/styleCreators';
import CardDisplayType from 'models/util/CardDisplayType';
import { MessageCardToolsProps } from './MessageCardTools';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import { ParsedMessageHeader } from './header/ParsedMessageHeader';

export interface ParsedMessageProps {
	displayType: CardDisplayType;
	isHighlighted?: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
}

interface OwnProps {
	parsedMessage: ParsedMessage;
	displayHeader: boolean;
	viewType?: MessageViewType;
	setViewType: (vt: MessageViewType, id: string) => void;
}

export const ParsedMessageComponent = React.memo((props: ParsedMessageProps & OwnProps) => {
	const {
		displayType,
		isHighlighted,
		parsedMessage,
		displayHeader,
		viewType,
		setViewType,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
	} = props;

	const parsedMessageClass = createBemBlock('parsed-message', isHighlighted ? 'highlighted' : null);

	return (
		<div className='parsed-message-wrapper'>
			{displayHeader && (
				<ParsedMessageHeader
					messageCardToolsConfig={messageCardToolsConfig}
					parsedMessage={parsedMessage}
					isScreenshotMsg={false}
					isHighlighted={isHighlighted}
					viewType={viewType}
					setViewType={setViewType}
				/>
			)}
			<div className={parsedMessageClass}>
				<div className='mc-body'>
					<div className='mc-body__human'>
						<MessageCardViewTypeRenderer
							{...messageViewTypeRendererProps}
							viewType={viewType}
							messageBody={parsedMessage.message}
							displayType={displayType}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});

ParsedMessageComponent.displayName = 'ParsedMessageComponent';
