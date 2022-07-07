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
import { EventMessage, ParsedMessage, MessageViewType } from '../../../../models/EventMessage';
import MessageCardTools, { MessageCardToolsProps } from '../MessageCardTools';

export interface ParsedMessageHeaderProps {
	message: EventMessage;
	parsedMessage: ParsedMessage;
	viewType: MessageViewType;
	setViewType: (vt: MessageViewType) => void;
	isScreenshotMsg: boolean;
}

export const ParsedMessageHeader = React.memo(
	(props: ParsedMessageHeaderProps & MessageCardToolsProps) => {
		const { message, parsedMessage, viewType, setViewType } = props;
		const messageCardToolsConfig: MessageCardToolsProps = {
			message,
			isBookmarked: props.isBookmarked || false,
			toggleMessagePin: props.toggleMessagePin || (() => null),
			isEmbedded: props.isEmbedded,
		};

		return (
			<div className='mc-header__info'>
				<span
					className='mc-header__value sessionId-inline'
					title={`Session: ${parsedMessage.message.metadata.id.sequence}`}>
					{parsedMessage.message.metadata.id.subsequence[0]}
				</span>
				<span
					className='mc-header__value messageType'
					title={
						parsedMessage.message.metadata.messageType &&
						`Name: ${parsedMessage.message.metadata.messageType}`
					}>
					{parsedMessage.message.metadata.messageType}
				</span>
				{viewType && setViewType && (
					<div className='message-card-tools__wrapper'>
						<MessageCardTools
							{...messageCardToolsConfig}
							parsedMessage={parsedMessage}
							isScreenshotMsg={props.isScreenshotMsg}
							viewType={viewType}
							setViewType={setViewType}
						/>
					</div>
				)}
			</div>
		);
	},
);

ParsedMessageHeader.displayName = 'ParsedMessageHeader';
