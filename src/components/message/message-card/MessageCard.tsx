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
import { observer } from 'mobx-react-lite';
import {
	useMessagesWorkspaceStore,
	useMessageDisplayRulesStore,
	useSelectedStore,
	useMessagesDataStore,
} from '../../../hooks';
import { getHashCode } from '../../../helpers/stringHash';
import { createBemBlock, createStyleSelector } from '../../../helpers/styleCreators';
import { formatTime, timestampToNumber } from '../../../helpers/date';
import { keyForMessage } from '../../../helpers/keys';
import StateSaver from '../../util/StateSaver';
import { MessageScreenshotZoom } from './MessageScreenshot';
import { EventMessage, isScreenshotMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardViewTypeRenderer, {
	MessageCardViewTypeRendererProps,
} from './MessageCardViewTypeRenderer';
import '../../../styles/messages.scss';
import { matchWildcardRule } from '../../../helpers/regexp';
import MessageCardTools, { MessageCardToolsConfig } from './MessageCardTools';

const HUE_SEGMENTS_COUNT = 36;

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
}

export interface MinimalMessageCardProps extends OwnProps, RecoveredProps {
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isHighlighted?: boolean;
	isSoftFiltered?: boolean;
	isContentBeautified?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
}

interface Props extends OwnProps, RecoveredProps {}

export function MinimalMessageCard({
	message,
	viewType,
	setViewType,
	hoverMessage,
	unhoverMessage,
	isAttached,
	isBookmarked,
	isHighlighted,
	isSoftFiltered,
	isContentBeautified,
	toogleMessagePin,
	isEmbedded,
}: MinimalMessageCardProps) {
	const { messageId, timestamp, messageType, sessionId, direction, bodyBase64, body } = message;

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
					<span className='mc-header__item messageId-inline' title={`ID: ${messageId}`}>
						<span className='mc-header__value'>{messageId} </span>
					</span>
					<span className={sessionClass} style={sessionArrowStyle}></span>
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
		messageBody: body,
		isBeautified: isContentBeautified || false,
		rawContent: bodyBase64,
		isSelected: isAttached || false,
		isEmbedded,
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
					<div className='mc-header__item messageId' title={`ID: ${messageId}`}>
						<span className='mc-header__value'>{messageId}</span>
					</div>
					<div className='mc-header__item' title={messageType && `Name: ${messageType}`}>
						<span className='mc-header__value messageType'>{messageType}</span>
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
										? `data:${message.messageType};base64,${message.bodyBase64}`
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

function MessageCardBase({ message, viewType, setViewType }: Props) {
	const { messageId } = message;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const selectedStore = useSelectedStore();

	const [isHighlighted, setHighlighted] = React.useState(false);

	const highlightTimer = React.useRef<NodeJS.Timeout>();
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isBookmarked =
		selectedStore.bookmarkedMessages.findIndex(
			bookmarkedMessage => bookmarkedMessage.id === messageId,
		) !== -1;

	const isSoftFiltered = messagesDataStore.isSoftFiltered.get(messageId);

	React.useEffect(() => {
		const abortController = new AbortController();

		if (
			messagesStore.filterStore.isSoftFilter &&
			messagesDataStore.isSoftFiltered.get(messageId) === undefined
		) {
			messagesDataStore.matchMessage(messageId, abortController.signal);
		}

		return () => {
			abortController.abort();
		};
	}, []);

	React.useEffect(() => {
		switch (viewType) {
			case MessageViewType.FORMATTED:
				messagesStore.beautify(messageId);
				break;
			case MessageViewType.ASCII:
				messagesStore.hideDetailedRawMessage(messageId);
				break;
			case MessageViewType.BINARY:
				messagesStore.showDetailedRawMessage(messageId);
				break;
			default:
				messagesStore.debeautify(messageId);
				break;
		}
	}, [viewType]);

	React.useEffect(() => {
		if (!isHighlighted) {
			if (messagesStore.highlightedMessageId === messageId) {
				setHighlighted(true);

				highlightTimer.current = setTimeout(() => {
					setHighlighted(false);
					messagesStore.highlightedMessageId = null;
				}, 3000);
			} else if (messagesStore.highlightedMessageId !== null) {
				setHighlighted(false);
			}
		}

		return () => {
			if (highlightTimer.current) {
				window.clearTimeout(highlightTimer.current);
			}
		};
	}, [messagesStore.highlightedMessageId]);

	const hoverMessage = () => {
		hoverTimeout.current = setTimeout(() => {
			messagesStore.setHoveredMessage(message);
		}, 600);
	};

	const unhoverMessage = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		messagesStore.setHoveredMessage(null);
	};

	const isAttached = !!messagesStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);

	function toogleMessagePin() {
		selectedStore.toggleMessagePin(message);
	}

	return (
		<MinimalMessageCard
			message={message}
			viewType={viewType}
			setViewType={setViewType}
			isHighlighted={isHighlighted}
			hoverMessage={hoverMessage}
			unhoverMessage={unhoverMessage}
			isBookmarked={isBookmarked}
			isAttached={isAttached}
			isContentBeautified={isContentBeautified}
			isSoftFiltered={isSoftFiltered}
			toogleMessagePin={toogleMessagePin}
		/>
	);
}

const MessageCard = observer(MessageCardBase);

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

const RecoverableMessageCard = React.memo((props: OwnProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	return (
		<StateSaver
			stateKey={keyForMessage(props.message.messageId)}
			getDefaultState={() => {
				const rootRule = rulesStore.rootDisplayRule;
				const declaredRule = rulesStore.messageDisplayRules.find(rule => {
					if (rule.session.length > 1 && rule.session.includes('*')) {
						return matchWildcardRule(props.message.sessionId, rule.session);
					}
					return props.message.sessionId.includes(rule.session);
				});
				if (!props.message.body) {
					return declaredRule
						? getRawViewType(declaredRule.viewType)
						: rootRule
						? getRawViewType(rootRule.viewType)
						: MessageViewType.ASCII;
				}
				return declaredRule
					? declaredRule.viewType
					: rootRule
					? rootRule.viewType
					: MessageViewType.JSON;
			}}>
			{(state, saveState) => (
				<MessageCard
					{...props}
					// we should always show raw content if something found in it
					viewType={state}
					setViewType={saveState}
				/>
			)}
		</StateSaver>
	);
});

RecoverableMessageCard.displayName = 'RecoverableMessageCard';

export default RecoverableMessageCard;

function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

function getRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}
