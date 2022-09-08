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
import { createBemBlock } from '../../../../helpers/styleCreators';
import { getSubsequence } from '../../../../helpers/message';

export interface ParsedMessageHeaderProps {
	parsedMessage?: ParsedMessage;
	viewType: MessageViewType;
	setViewType: (vt: MessageViewType, id: string) => void;
	isHighlighted?: boolean;
	isRawMessage: boolean;
	isScreenshotMsg: boolean;
	messageCardToolsConfig: MessageCardToolsProps;
}

export const ParsedMessageHeader = React.memo((props: ParsedMessageHeaderProps) => {
	const {
		parsedMessage,
		viewType,
		setViewType,
		isRawMessage,
		isScreenshotMsg,
		isHighlighted,
	} = props;

	const headerClass = createBemBlock('mc-header__info', isHighlighted ? 'highlighted' : null);

	const subsequence = parsedMessage && getSubsequence(parsedMessage);

	return (
		<div className={headerClass}>
			<Chip>
				<div className='mc-header__message-icon'></div>
			</Chip>
			{!isRawMessage && (
				<>
					{typeof subsequence === 'number' && (
						<Chip title={`Session: ${parsedMessage?.message.metadata.id.sequence}`}>
							{subsequence}
						</Chip>
					)}
					<Chip
						className='mc-header__value'
						title={
							parsedMessage
								? `Name: ${parsedMessage.message.metadata.messageType}`
								: 'Name: RawMessage'
						}>
						{parsedMessage?.message.metadata.messageType}
					</Chip>
				</>
			)}

			<div className='message-card-tools__wrapper'>
				<MessageCardTools
					{...props.messageCardToolsConfig}
					parsedMessage={parsedMessage}
					isScreenshotMsg={isScreenshotMsg}
					viewType={viewType}
					setViewType={setViewType}
				/>
			</div>
		</div>
	);
});

ParsedMessageHeader.displayName = 'ParsedMessageHeader';
