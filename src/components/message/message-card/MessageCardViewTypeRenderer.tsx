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
import { MessageViewType } from '../../../models/EventMessage';
import ErrorBoundary from '../../util/ErrorBoundary';
import MessageBodyCard, { MessageBodyCardFallback } from './MessageBodyCard';
import SimpleMessageRaw from './raw/SimpleMessageRaw';
import DetailedMessageRaw from './raw/DetailedMessageRaw';
import MessageBody from '../../../models/MessageBody';
import CardDisplayType from '../../../util/CardDisplayType';

export type MessageCardViewTypeRendererProps = {
	messageId: string;
	rawContent: string | null;
	isSelected: boolean;
	isEmbedded?: boolean;
	isDetailed?: boolean;
	sortOrderItems: string[];
};

type OwnProps = {
	messageBody?: MessageBody;
	viewType?: MessageViewType;
	displayType: CardDisplayType;
};

const MessageCardViewTypeRenderer = ({
	rawContent,
	isSelected,
	displayType,
	viewType,
	messageBody,
	sortOrderItems,
}: MessageCardViewTypeRendererProps & OwnProps) => {
	if (messageBody) {
		switch (viewType) {
			case MessageViewType.FORMATTED:
			case MessageViewType.JSON:
				return (
					<ErrorBoundary
						fallback={
							<MessageBodyCardFallback
								isBeautified={viewType === MessageViewType.FORMATTED}
								isSelected={isSelected}
								body={messageBody}
								sortOrderItems={sortOrderItems}
							/>
						}>
						<MessageBodyCard
							isBeautified={viewType === MessageViewType.FORMATTED}
							body={messageBody}
							isSelected={isSelected}
							sortOrderItems={sortOrderItems}
						/>
					</ErrorBoundary>
				);
			default:
				return null;
		}
	} else {
		switch (viewType) {
			case MessageViewType.ASCII:
				return rawContent ? <SimpleMessageRaw rawContent={rawContent} /> : null;
			case MessageViewType.BINARY:
				return rawContent ? (
					<DetailedMessageRaw rawContent={rawContent} displayType={displayType} />
				) : null;
			default:
				return null;
		}
	}
};

export default MessageCardViewTypeRenderer;
