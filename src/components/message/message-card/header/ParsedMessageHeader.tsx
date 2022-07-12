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
import { ParsedMessage, MessageViewType } from '../../../../models/EventMessage';
import MessageCardTools, { MessageCardToolsProps } from '../MessageCardTools';
import { Chip } from '../../../Chip';

export interface ParsedMessageHeaderProps {
	parsedMessage?: ParsedMessage;
	rawMessageIndex?: number;
	viewType: MessageViewType;
	setViewType: (vt: MessageViewType) => void;
	isScreenshotMsg: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
}

export const ParsedMessageHeader = React.memo((props: ParsedMessageHeaderProps) => {
	const { parsedMessage, viewType, setViewType, rawMessageIndex } = props;

	return (
		<div className='mc-header__info'>
			<Chip>
				<div className='mc-header__message-icon'></div>
			</Chip>
			<Chip
				title={`Session: ${parsedMessage?.message.metadata.id.sequence}`}
				text={parsedMessage?.message.metadata.id.subsequence[0] || rawMessageIndex}
			/>
			{!rawMessageIndex && (
				<Chip
					className='mc-header__value'
					title={
						parsedMessage
							? `Name: ${parsedMessage.message.metadata.messageType}`
							: 'Name: RawMessage'
					}
					text={parsedMessage?.message.metadata.messageType}
				/>
			)}

			<div className='message-card-tools__wrapper'>
				<MessageCardTools
					{...props.messageCardToolsConfig}
					parsedMessage={parsedMessage}
					isScreenshotMsg={props.isScreenshotMsg}
					viewType={viewType}
					setViewType={setViewType}
				/>
			</div>
		</div>
	);
});

ParsedMessageHeader.displayName = 'ParsedMessageHeader';
