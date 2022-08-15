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
import { ParsedMessage, MessageViewType, EventMessage } from 'models/EventMessage';
import CardDisplayType from 'models/util/CardDisplayType';
import { MessageCardToolsProps } from './MessageCardTools';
import MessageBodyComponent, { MessageCardViewTypeRendererProps } from './MessageBody';
import { ParsedMessageHeader } from './header/ParsedMessageHeader';

export interface ParsedMessageProps {
	displayType: CardDisplayType;
	messageCardToolsConfig: MessageCardToolsProps;
	messageViewTypeRendererProps: MessageCardViewTypeRendererProps;
	rawMessageIndex?: number;
}

interface OwnProps {
	parsedMessage?: ParsedMessage;
	message?: EventMessage;
	displayHeader?: boolean;
	viewType?: MessageViewType;
	setViewType: (id: string, vt: MessageViewType) => void;
}

export const ParsedMessageComponent = React.memo((props: ParsedMessageProps & OwnProps) => {
	const { parsedMessage, displayHeader = true, messageViewTypeRendererProps } = props;

	return (
		<div className='parsed-message'>
			{displayHeader && <ParsedMessageHeader {...props} isScreenshotMsg={false} />}
			<MessageBodyComponent
				messageBody={parsedMessage?.message}
				{...messageViewTypeRendererProps}
				{...props}
			/>
		</div>
	);
});

ParsedMessageComponent.displayName = 'ParsedMessageComponent';
