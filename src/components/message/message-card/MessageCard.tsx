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
	useHeatmap,
	useSelectedStore,
	useWorkspaceStore,
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
import RadioGroup from '../../util/RadioGroup';
import { RadioProps } from '../../util/Radio';
import { matchWildcardRule } from '../../../helpers/regexp';

const HUE_SEGMENTS_COUNT = 36;

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
}

interface Props extends OwnProps, RecoveredProps {}

function MessageCardBase({ message, viewType, setViewType }: Props) {
	const messagesStore = useMessagesWorkspaceStore();
	const selectedStore = useSelectedStore();
	const workspaceStore = useWorkspaceStore();

	const { heatmapElements } = useHeatmap();

	const [isHighlighted, setHighlighted] = React.useState(false);
	const highlightTimer = React.useRef<NodeJS.Timeout>();
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const heatmapElement = heatmapElements.find(el => el.id === message.messageId);
	const { messageId, timestamp, messageType, sessionId, direction, bodyBase64, body } = message;

	const isSelected = Boolean(heatmapElement);
	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isPinned = selectedStore.pinnedMessages.findIndex(m => m.messageId === messageId) !== -1;

	const toggleViewType = (v: MessageViewType) => {
		setViewType(v);
	};

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
		}, 150);
	};

	const unhoverMessage = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		messagesStore.setHoveredMessage(null);
	};

	const messageViewTypeSwitchConfig: RadioProps<MessageViewType>[] = React.useMemo(
		() => [
			{
				value: MessageViewType.JSON,
				id: `${MessageViewType.JSON}-${messageId}-${workspaceStore.id}`,
				name: `message-view-type-${messageId}-${workspaceStore.id}`,
				className: 'message-view-type-radio',
				checked: viewType === MessageViewType.JSON,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.FORMATTED,
				id: `${MessageViewType.FORMATTED}-${messageId}-${workspaceStore.id}`,
				name: `message-view-type-${messageId}-${workspaceStore.id}`,
				className: 'message-view-type-radio',
				checked: viewType === MessageViewType.FORMATTED,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.BINARY,
				id: `${MessageViewType.BINARY}-${messageId}-${workspaceStore.id}`,
				name: `message-view-type-${messageId}-${workspaceStore.id}`,
				className: 'message-view-type-radio',
				checked: viewType === MessageViewType.BINARY,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.ASCII,
				id: `${MessageViewType.ASCII}-${messageId}-${workspaceStore.id}`,
				name: `message-view-type-${messageId}-${workspaceStore.id}`,
				className: 'message-view-type-radio',
				checked: viewType === MessageViewType.ASCII,
				onChange: toggleViewType,
			},
		],
		[messageId, viewType],
	);

	const isAttached = !!messagesStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);

	const isSoftFiltered =
		messagesStore.dataStore.softFilterResults.findIndex(m => m.messageId === messageId) !== -1;

	const isScreenshotMsg = isScreenshotMessage(message);

	const color = heatmapElement?.colors[0];

	const rootClass = createBemBlock(
		'message-card-wrapper',
		isSelected ? 'selected' : null,
		isAttached ? 'attached' : null,
		isPinned ? 'pinned' : null,
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

	const bookmarkIconClass = createBemBlock('bookmark-button', isPinned ? 'pinned' : null);

	const renderMessageInfo = () => {
		if (viewType === MessageViewType.FORMATTED || viewType === MessageViewType.BINARY) {
			const formattedTimestamp = formatTime(timestampToNumber(timestamp));
			return (
				<div className='mc-header__info'>
					<div className='mc-header__value' title={`Timestamp: ${formattedTimestamp}`}>
						{timestamp && formattedTimestamp}
					</div>
					<div className='mc-header__item' title={`Session: ${sessionId}`}>
						<span className={sessionClass} style={sessionArrowStyle}></span>
						<span className='mc-header__value'>{sessionId}</span>
					</div>
					<div className='mc-header__item messageId' title={`ID: ${messageId}`}>
						<span className='mc-header__value'>{messageId}</span>
					</div>
					<div className='mc-header__item' title={`Name: ${messageType}`}>
						<span className='mc-header__value'>{messageType}</span>
					</div>
				</div>
			);
		}
		return null;
	};

	const renderInlineMessageInfo = () => {
		if (viewType === MessageViewType.ASCII || viewType === MessageViewType.JSON) {
			const formattedTimestamp = formatTime(timestampToNumber(timestamp));
			return (
				<>
					<span className='mc-header__value' title={`Timestamp: ${formattedTimestamp}`}>
						{timestamp && formattedTimestamp}
					</span>
					<span className='mc-header__value sessionId-inline' title={`Session: ${sessionId}`}>
						{sessionId}
					</span>
					<span className='mc-header__item messageId-inline' title={`ID: ${messageId}`}>
						<span className='mc-header__value'>{messageId} </span>
					</span>
					<span className={`${sessionClass} inline`} style={sessionArrowStyle}></span>
					<span className='mc-header__value' title={`Name: ${messageType}`}>
						{messageType}
					</span>
				</>
			);
		}
		return null;
	};

	const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
		renderInfo: renderInlineMessageInfo,
		viewType,
		messageId,
		messageBody: body,
		isBeautified: isContentBeautified,
		rawContent: bodyBase64,
		isSelected: color !== undefined,
	};

	return (
		<div className={rootClass} onMouseEnter={hoverMessage} onMouseLeave={unhoverMessage}>
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
			<div className='message-card-tools'>
				<div
					className={bookmarkIconClass}
					title={isPinned ? 'Remove from bookmarks' : 'Add to bookmarks'}
					onClick={() => selectedStore.toggleMessagePin(message)}></div>
				<div className='mc-header__controls'>
					{!isScreenshotMsg && (
						<RadioGroup className='mc-header__radios' radioConfigs={messageViewTypeSwitchConfig} />
					)}
					{isScreenshotMsg && (
						<>
							<div className='mc-header__control-button mc-header__icon mc-headr__zoom-button' />
							<a
								className='mc-header__control-button mc-header__icon mc-header__download-button'
								download={`${messageId}.${messageType.replace('image/', '')}`}
								href={`data:${message.messageType};base64,${message.bodyBase64 || ''}`}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

const MessageCard = observer(MessageCardBase);

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

const RecoverableMessageCard = (props: OwnProps) => {
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
};

export default RecoverableMessageCard;
