/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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
import MessageBody from '../../../models/MessageBody';
import ErrorBoundary from '../../util/ErrorBoundary';
import MessageBodyCard, { MessageBodyCardFallback } from './MessageBodyCard';
import { MessageViewType } from './MessageCard';
import MessageRaw from './raw/MessageRaw';

export type MessageCardViewTypeRendererProps = {
	viewType: MessageViewType;
	messageId: string;
	rawContent: string | null;
	isBeautified: boolean;
	isSelected: boolean;
	messageBody: MessageBody | null;
};

const MessageCardViewTypeRenderer = ({
	viewType,
	messageId,
	rawContent,
	isBeautified,
	isSelected,
	messageBody,
}: MessageCardViewTypeRendererProps) => {
	switch (viewType) {
		case MessageViewType.FORMATTED:
		case MessageViewType.JSON:
			return (
				<ErrorBoundary
					fallback={
						<MessageBodyCardFallback
							isBeautified={isBeautified}
							isSelected={isSelected}
							body={messageBody}
						/>
					}>
					<MessageBodyCard isBeautified={isBeautified} body={messageBody} isSelected={isSelected} />
				</ErrorBoundary>
			);
		case MessageViewType.ASCII:
		case MessageViewType.BINARY:
			return rawContent ? <MessageRaw messageId={messageId} rawContent={rawContent} /> : null;
		default:
			return null;
	}
};

export default MessageCardViewTypeRenderer;
