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
import { getHashCode } from '../../../helpers/stringHash';
import { createBemBlock, createStyleSelector } from '../../../helpers/styleCreators';
import { formatTime, timestampToNumber } from '../../../helpers/date';
import { MessageScreenshotZoom } from './MessageScreenshot';
import { EventMessage, isScreenshotMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import MessageCardTools, { MessageCardToolsConfig } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageBodyPayload } from '../../../models/MessageBody';

const HUE_SEGMENTS_COUNT = 36;

export interface MessageCardBaseProps {
	message: EventMessage;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isContentBeautified?: boolean;
	toogleMessagePin?: () => void;
	isDetailed?: boolean;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
	viewType: MessageViewType;
	bodyItem: MessageBodyPayload;
	setViewType: (viewType: MessageViewType) => void;
}

export function MessageCardBase({
	message,
	viewType,
	setViewType,
	hoverMessage,
	unhoverMessage,
	isAttached,
	isBookmarked,
	isHighlighted,
	isSoftFiltered,
	toogleMessagePin,
	isEmbedded,
	isDetailed,
	sortOrderItems,
	bodyItem,
}: MessageCardBaseProps) {
	const { messageId, timestamp, messageType, sessionId, direction, bodyBase64 } = message;

	const renderInlineMessageInfo = () => {
		if (viewType === MessageViewType.ASCII || viewType === MessageViewType.JSON) {
			const formattedTimestamp = formatTime(timestampToNumber(timestamp));

			return (
				<>
					<span
						className='mc-header__value mc-header__timestamp'
						title={`Timestamp: ${formattedTimestamp}`}
						onMouseEnter={hoverMessage}
						onMouseLeave={unhoverMessage}>
						{timestamp && formattedTimestamp}
					</span>
					<span className='mc-header__value sessionId-inline' title={`Session: ${sessionId}`}>
						{sessionId}
					</span>
					<span
						className='mc-header__item messageId-inline'
						title={`ID: ${messageId}:${bodyItem.subsequenceId[0]}`}>
						<span className='mc-header__value'>
							{messageId}:{bodyItem.subsequenceId[0]}
						</span>
					</span>
					<span className={sessionClass} style={sessionArrowStyle}></span>
					<span
						className='mc-header__value messageType'
						title={
							bodyItem.message.metadata.messageType &&
							`Name: ${bodyItem.message.metadata.messageType}`
						}>
						{bodyItem.message.metadata.messageType}
					</span>
				</>
			);
		}
		return null;
	};

	const rootClass = createBemBlock(
		'message-card-wrapper',
		isAttached ? 'attached' : null,
		isBookmarked ? 'pinned' : null,
		isHighlighted ? 'highlighted' : null,
		isSoftFiltered ? 'soft-filtered' : null,
	);

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		display: 'inline-flex',
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	const toggleViewType = (v: MessageViewType) => {
		setViewType(v);
	};

	const isScreenshotMsg = isScreenshotMessage(message);

	const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
		renderInfo: renderInlineMessageInfo,
		viewType,
		messageId,
		messageBody: bodyItem,
		isBeautified: viewType === MessageViewType.FORMATTED,
		rawContent: bodyBase64,
		isSelected: isAttached || false,
		isDetailed,
		sortOrderItems: sortOrderItems || [],
	};

	const messageCardToolsConfig: MessageCardToolsConfig = {
		message,
		messageId,
		messageType,
		messageViewType: viewType,
		toggleViewType,
		isBookmarked: isBookmarked || false,
		toggleMessagePin: toogleMessagePin || (() => null),
		isScreenshotMsg,
		isEmbedded,
		bodyItem,
	};

	const renderMessageInfo = () => {
		if (viewType === MessageViewType.FORMATTED || viewType === MessageViewType.BINARY) {
			const formattedTimestamp = formatTime(timestampToNumber(timestamp));

			return (
				<div className='mc-header__info'>
					<div
						className='mc-header__value mc-header__timestamp'
						title={`Timestamp: ${formattedTimestamp}`}
						onMouseEnter={hoverMessage}
						onMouseLeave={unhoverMessage}>
						{timestamp && formattedTimestamp}
					</div>
					<div className='mc-header__item' title={`Session: ${sessionId}`}>
						<span className={sessionClass} style={sessionArrowStyle} />
						<span className='mc-header__value'>{sessionId}</span>
					</div>
					<div
						className='mc-header__item messageId'
						title={`ID: ${messageId}:${bodyItem.subsequenceId[0]}`}>
						<span className='mc-header__value'>
							{messageId}:{bodyItem.subsequenceId[0]}
						</span>
					</div>
					<div
						className='mc-header__item'
						title={
							bodyItem.message.metadata.messageType &&
							`Name: ${bodyItem.message.metadata.messageType}`
						}>
						<span className='mc-header__value messageType'>
							{bodyItem.message.metadata.messageType}
						</span>
					</div>
				</div>
			);
		}
		return null;
	};

	return (
		<div className={rootClass}>
			<div className='message-card'>
				<div className='mc__mc-header mc-header'>{renderMessageInfo()}</div>
				<div className='mc__mc-body mc-body'>
					{isScreenshotMsg ? (
						<div className='mc-body__screenshot'>
							<MessageScreenshotZoom
								src={
									typeof bodyBase64 === 'string'
										? `data:${bodyItem.message.metadata.messageType};base64,${message.bodyBase64}`
										: ''
								}
								alt={message.messageId}
							/>
						</div>
					) : (
						<div className='mc-body__human'>
							<MessageCardViewTypeRenderer {...messageViewTypeRendererProps} />
						</div>
					)}
				</div>
			</div>
			<MessageCardTools {...messageCardToolsConfig} />
		</div>
	);
}

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}
