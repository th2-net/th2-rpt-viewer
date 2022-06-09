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
import { createStyleSelector, createBemBlock } from '../../../helpers/styleCreators';
import { formatTime } from '../../../helpers/date';
import { MessageScreenshotZoom } from './MessageScreenshot';
import { EventMessage, isScreenshotMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import Checkbox from '../../util/Checkbox';
import MessageCardTools, { MessageCardToolsConfig } from './MessageCardTools';
import '../../../styles/messages.scss';
import { MessageHeader } from './MessageHeader';

export interface MessageCardBaseProps {
	message: EventMessage;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isContentBeautified?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	isExported?: boolean;
	isExport?: boolean;
	sortOrderItems?: string[];
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
	addMessageToExport?: () => void;
	applyFilterToBody?: boolean;
}

const MessageCardBase = React.memo(
	({
		message,
		viewType,
		setViewType,
		isAttached,
		isBookmarked,
		isHighlighted,
		isSoftFiltered,
		toogleMessagePin,
		isEmbedded,
		isExported,
		isExport,
		sortOrderItems,
		addMessageToExport,
		applyFilterToBody,
	}: MessageCardBaseProps) => {
		const { id, timestamp, messageType, sessionId, direction, bodyBase64, body } = message;

		const splittedMessageId = id.split(':');
		const messageIdWithHighlightedSession = splittedMessageId.map(
			getMessageIdWithHighlightedSession,
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

		const rootClass = createBemBlock(
			'message-card-wrapper',
			isAttached ? 'attached' : null,
			isBookmarked ? 'pinned' : null,
			isHighlighted ? 'highlighted' : null,
			isSoftFiltered ? 'soft-filtered' : null,
			isExport ? 'export-mode' : null,
			isExported ? 'exported' : null,
		);

		const iconsClassName = createBemBlock(
			'message-card-icons',
			isAttached ? 'attached' : null,
			isBookmarked ? 'pinned' : null,
		);

		const renderInlineMessageInfo = () => {
			if (viewType === MessageViewType.ASCII || viewType === MessageViewType.JSON) {
				const formattedTimestamp = formatTime(timestamp);
				return (
					<>
						{isExport ? (
							<Checkbox id={id} checked={!!isExported} onChange={() => addMessageToExport?.()} />
						) : (
							<span className={iconsClassName} />
						)}
						<span className={sessionClass} style={sessionArrowStyle}></span>
						<span
							className='mc-header__value mc-header__timestamp'
							title={`Timestamp: ${formattedTimestamp}`}>
							{timestamp && formattedTimestamp}
						</span>
						<span className='mc-header__value'>{messageIdWithHighlightedSession} </span>
						<span
							className='mc-header__value messageType'
							title={messageType && `Name: ${messageType}`}>
							{messageType}
						</span>
					</>
				);
			}
			return null;
		};

		const toggleViewType = (v: MessageViewType) => {
			setViewType(v);
		};

		const isScreenshotMsg = isScreenshotMessage(message);

		const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
			renderInfo: renderInlineMessageInfo,
			viewType,
			messageId: id,
			messageBody: body,
			isBeautified: viewType === MessageViewType.FORMATTED,
			rawContent: bodyBase64,
			isSelected: isAttached || false,
			applyFilterToBody,
			sortOrderItems: sortOrderItems || [],
		};

		const messageCardToolsConfig: MessageCardToolsConfig = {
			message,
			messageViewType: viewType,
			toggleViewType,
			isBookmarked: isBookmarked || false,
			toggleMessagePin: toogleMessagePin || (() => null),
			isScreenshotMsg,
			isEmbedded,
		};

		const renderMessageInfo = () => {
			if (viewType === MessageViewType.FORMATTED || viewType === MessageViewType.BINARY) {
				const formattedTimestamp = formatTime(timestamp);
				return (
					<div className='mc-header__info'>
						{isExport ? (
							<Checkbox
								id={id}
								checked={!!isExported}
								onChange={() => {
									addMessageToExport?.();
								}}
							/>
						) : (
							<div className={iconsClassName} />
						)}
						<div className={sessionClass} style={sessionArrowStyle} />
						<p
							className='mc-header__value mc-header__timestamp'
							title={`Timestamp: ${formattedTimestamp}`}>
							{timestamp && formattedTimestamp}
						</p>
						<p className='mc-header__value'>{messageIdWithHighlightedSession}</p>
						<p className='mc-header__value messageType'>{messageType}</p>
					</div>
				);
			}
			return null;
		};

		return (
			<div className={rootClass} onClick={addMessageToExport}>
				<div className='message-card'>
					<div className='mc__mc-header mc-header'>{renderMessageInfo()}</div>
					<div className='mc__mc-body mc-body'>
						<MessageHeader message={message} />
						{isScreenshotMsg ? (
							<div className='mc-body__screenshot'>
								<MessageScreenshotZoom
									src={
										typeof bodyBase64 === 'string'
											? `data:${message.messageType};base64,${message.bodyBase64}`
											: ''
									}
									alt={message.id}
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
	},
);

MessageCardBase.displayName = 'MessageCardBase';
export default MessageCardBase;

const HUE_SEGMENTS_COUNT = 36;

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

function getMessageIdWithHighlightedSession(part: string, i: number, arr: string[]) {
	const defaultPart = <span key={part}>{`:${part}`}</span>;

	if (arr.length === 3) {
		return i === 0 ? <b key={part}>{part}</b> : defaultPart;
	}

	if (i === 0) {
		return <b key={part}>{part}</b>;
	}
	if (i === 1) {
		return <b key={part}>{`:${part}`}</b>;
	}
	return defaultPart;
}
