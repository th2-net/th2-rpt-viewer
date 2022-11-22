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
import { ParsedMessage, MessageViewType, EventMessage } from 'models/EventMessage';
import { createBemElement } from 'helpers/styleCreators';
import { Chip } from 'components/Chip';
import { MessageIcon } from 'components/icons/MessageIcon';
import MessageCardTools from '../MessageCardTools';
import { getSubsequence } from '../../../helpers/message';

export interface ParsedMessageHeaderProps {
	parsedMessage?: ParsedMessage;
	viewType?: MessageViewType;
	setViewType: (id: string, vt: MessageViewType) => void;
	isHighlighted?: boolean;
	isScreenshotMsg: boolean;
	toggleMessagePin?: () => void;
	message: EventMessage;
}

export const ParsedMessageHeader = memo((props: ParsedMessageHeaderProps) => {
	const { parsedMessage, viewType, setViewType, isScreenshotMsg, isHighlighted } = props;

	const headerClass = createBemElement('mc-header', 'info', isHighlighted ? 'highlighted' : null);

	const subsequence = parsedMessage && getSubsequence(parsedMessage);

	return (
		<div className={headerClass}>
			<Chip>
				<MessageIcon />
			</Chip>
			{parsedMessage && (
				<>
					{typeof subsequence === 'number' && <Chip>{subsequence}</Chip>}
					<Chip
						className='mc-header__value'
						title={`Name: ${parsedMessage.message.metadata.messageType}`}>
						{parsedMessage.message.metadata.messageType}
					</Chip>
				</>
			)}
			<div className='message-card-tools__wrapper'>
				<MessageCardTools
					{...props}
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
