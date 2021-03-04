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
	useHeatmap,
	useSelectedStore,
	useWorkspaceStore,
} from '../../../hooks';
import { getHashCode } from '../../../helpers/stringHash';
import { createBemBlock, createStyleSelector } from '../../../helpers/styleCreators';
import { formatTime, getTimestampAsNumber } from '../../../helpers/date';
import { keyForMessage } from '../../../helpers/keys';
import StateSaver from '../../util/StateSaver';
import { MessageScreenshotZoom } from './MessageScreenshot';
import { EventMessage, isScreenshotMessage } from '../../../models/EventMessage';

import MessageCardViewTypeSwitcher, {
	MessageCardViewTypeSwitcherProps,
} from './MessageCardViewTypeSwitcher';
import '../../../styles/messages.scss';
import RadioGroup, { RadioGroupProps } from '../../util/RadioGroup';
import { RadioProps } from '../../util/Radio';

const HUE_SEGMENTS_COUNT = 36;

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	showRaw: boolean;
	showRawHandler: (showRaw: boolean) => void;
}

export enum MessageViewType {
	JSON = 'json',
	FORMATTED = 'formatted',
	ASCII = 'ASCII',
	BINARY = 'binary',
}

interface Props extends OwnProps, RecoveredProps {}

function MessageCardBase({ message, showRaw, showRawHandler }: Props) {
	const messagesStore = useMessagesWorkspaceStore();
	const selectedStore = useSelectedStore();
	const workspaceStore = useWorkspaceStore();
	const { heatmapElements } = useHeatmap();
	const [isHighlighted, setHighlighted] = React.useState(false);
	const [messageViewType, setMessageViewType] = React.useState<MessageViewType>(
		MessageViewType.JSON,
	);
	const highlightTimer = React.useRef<NodeJS.Timeout>();
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const heatmapElement = heatmapElements.find(el => el.id === message.messageId);
	const { messageId, timestamp, messageType, sessionId, direction, bodyBase64, body } = message;

	const isSelected = Boolean(heatmapElement);
	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isPinned = selectedStore.pinnedMessages.findIndex(m => m.messageId === messageId) !== -1;

	const toggleViewType = (v: MessageViewType) => {
		setMessageViewType(v);
	};

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

	const messageViewTypeSwitchConfig: RadioProps<MessageViewType>[] = React.useMemo(
		() => [
			{
				value: MessageViewType.JSON,
				id: `${MessageViewType.JSON}-${messageId}`,
				name: `message-view-type-${messageId}`,
				className: 'message-view-type-radio',
				checked: messageViewType === MessageViewType.JSON,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.FORMATTED,
				id: `${MessageViewType.FORMATTED}-${messageId}`,
				name: `message-view-type-${messageId}`,
				className: 'message-view-type-radio',
				checked: messageViewType === MessageViewType.FORMATTED,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.BINARY,
				id: `${MessageViewType.BINARY}-${messageId}`,
				name: `message-view-type-${messageId}`,
				className: 'message-view-type-radio',
				checked: messageViewType === MessageViewType.BINARY,
				onChange: toggleViewType,
			},
			{
				value: MessageViewType.ASCII,
				id: `${MessageViewType.ASCII}-${messageId}`,
				name: `message-view-type-${messageId}`,
				className: 'message-view-type-radio',
				checked: messageViewType === MessageViewType.ASCII,
				onChange: toggleViewType,
			},
		],
		[messageId, messageViewType],
	);

	React.useEffect(() => {
		if (messageViewType === MessageViewType.ASCII || messageViewType === MessageViewType.BINARY) {
			showRawHandler(true);
		} else {
			showRawHandler(false);
		}
		switch (messageViewType) {
			case MessageViewType.FORMATTED:
				messagesStore.beautify(messageId);
				break;
			case MessageViewType.ASCII:
				messagesStore.undetailify(messageId);
				break;
			case MessageViewType.BINARY:
				messagesStore.detailify(messageId);
				break;
			default:
				messagesStore.debeautify(messageId);
				break;
		}
	}, [messageViewType]);

	const isAttached = !!workspaceStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);

	const isScreenshotMsg = isScreenshotMessage(message);

	const color = heatmapElement?.colors[0];

	const rootClass = createBemBlock(
		'message-card',
		isSelected ? 'selected' : null,
		isAttached ? 'attached' : null,
		isPinned ? 'pinned' : null,
		isHighlighted ? 'highlighted' : null,
	);

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	const bookmarkIconClass = createBemBlock('bookmark-button', isPinned ? 'pinned' : null);

	const hoverMessage = () => {
		hoverTimeout.current = setTimeout(() => {
			messagesStore.setHoveredMessage(message);
		}, 150);
	};

	const unhoverMessage = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		messagesStore.setHoveredMessage(null);
	};

	const messageViewTypeSwitcherProps: MessageCardViewTypeSwitcherProps = {
		messageId,
		showRaw,
		messageBody: body,
		isBeautified: isContentBeautified,
		rawContent: bodyBase64,
		isSelected: color !== undefined,
	};

	return (
		<div className='message-card-wrapper' onMouseEnter={hoverMessage} onMouseLeave={unhoverMessage}>
			<div className={rootClass}>
				<div className='mc__mc-header mc-header'>
					<div className='mc-header__is-attached-icon'></div>
					<div className='mc-header__info'>
						<div className='mc-header__value'>
							{timestamp && formatTime(getTimestampAsNumber(timestamp))}
						</div>
						<div className='mc-header__item'>
							<span className='mc-header__key-minified'>nm</span>
							<span className='mc-header__key'>Name</span>
							<span className='mc-header__value'>{messageType}</span>
						</div>
						<div className='mc-header__item'>
							<span className='mc-header__key-minified'>ss</span>
							<span className='mc-header__key'>Session</span>
							<span className={sessionClass} style={sessionArrowStyle}></span>
							<span className='mc-header__value'>{sessionId}</span>
						</div>
						<div className='mc-header__item'>
							<span className='mc-header__key-minified'>id</span>
							<span className='mc-header__key'>ID</span>
							<span className='mc-header__value'>{messageId}</span>
						</div>
					</div>
					<div className='mc-header__controls'>
						{!isScreenshotMsg && (
							<RadioGroup
								className='mc-header__radios'
								radioConfigs={messageViewTypeSwitchConfig}
							/>
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
						<div
							className={bookmarkIconClass}
							title={isPinned ? 'Remove from bookmarks' : 'Add to bookmarks'}
							onClick={() => selectedStore.toggleMessagePin(message)}></div>
					</div>
				</div>
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
							<MessageCardViewTypeSwitcher {...messageViewTypeSwitcherProps} />
						</div>
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

const RecoverableMessageCard = (props: OwnProps) => (
	<StateSaver stateKey={keyForMessage(props.message.messageId)} getDefaultState={() => false}>
		{(state, saveState) => (
			<MessageCard
				{...props}
				// we should always show raw content if something found in it
				showRaw={state}
				showRawHandler={saveState}
			/>
		)}
	</StateSaver>
);

export default RecoverableMessageCard;
