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

import { useMemo } from 'react';
import { MessageViewType } from 'models/EventMessage';
import CardDisplayType from 'models/util/CardDisplayType';
import ErrorBoundary from 'components/util/ErrorBoundary';
import MessageBody from '../../models/MessageBody';
import MessageBodyCard, { MessageBodyCardFallback } from './MessageBodyCard';
import SimpleMessageRaw from './raw/SimpleMessageRaw';
import DetailedMessageRaw from './raw/DetailedMessageRaw';
import { MessageScreenshotZoom } from './MessageScreenshot';

export type MessageCardViewTypeRendererProps = {
	messageId: string;
	rawMessageBase64: string | null;
	isSelected: boolean;
	isEmbedded?: boolean;
	isDetailed?: boolean;
	sortOrderItems: string[];
	isScreenshotMsg?: boolean;
};

interface MessageBodyProps extends MessageCardViewTypeRendererProps {
	messageBody?: MessageBody;
	viewType?: MessageViewType;
	displayType: CardDisplayType;
}

const MessageViewTypeRenderer = ({
	rawMessageBase64,
	isSelected,
	displayType,
	viewType,
	messageBody,
	sortOrderItems,
}: MessageBodyProps) => {
	switch (viewType) {
		case MessageViewType.FORMATTED:
		case MessageViewType.JSON:
			return (
				<ErrorBoundary
					fallback={
						<MessageBodyCardFallback
							isBeautified={viewType === MessageViewType.FORMATTED}
							isSelected={isSelected}
							body={messageBody || null}
							sortOrderItems={sortOrderItems}
						/>
					}>
					<MessageBodyCard
						isBeautified={viewType === MessageViewType.FORMATTED}
						body={messageBody || null}
						isSelected={isSelected}
						sortOrderItems={sortOrderItems}
					/>
				</ErrorBoundary>
			);
		case MessageViewType.ASCII:
			return rawMessageBase64 ? <SimpleMessageRaw rawContent={rawMessageBase64} /> : null;
		case MessageViewType.BINARY:
			return rawMessageBase64 ? (
				<DetailedMessageRaw rawContent={rawMessageBase64} displayType={displayType} />
			) : null;
		default:
			return null;
	}
};

const MessageBodyComponent = (props: MessageBodyProps) => {
	const { rawMessageBase64, isScreenshotMsg, messageId } = props;

	const screenshotSrc = useMemo(
		() =>
			isScreenshotMsg && typeof rawMessageBase64 === 'string'
				? `data:screenshot;base64,${rawMessageBase64}`
				: '',
		[rawMessageBase64, isScreenshotMsg],
	);

	return (
		<div className='parsed-message__body'>
			<div className='mc-body'>
				{isScreenshotMsg ? (
					<div className='mc-body__screenshot'>
						<MessageScreenshotZoom src={screenshotSrc} alt={messageId} />
					</div>
				) : (
					<div className='mc-body__human'>
						<MessageViewTypeRenderer {...props} />
					</div>
				)}
			</div>
		</div>
	);
};

export default MessageBodyComponent;
