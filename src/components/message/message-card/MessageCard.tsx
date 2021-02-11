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
import { EventMessage } from '../../../models/EventMessage';
import MessageRaw from './raw/MessageRaw';
import MessageBodyCard, { MessageBodyCardFallback } from './MessageBodyCard';
import ErrorBoundary from '../../util/ErrorBoundary';
import '../../../styles/messages.scss';

const HUE_SEGMENTS_COUNT = 36;

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	showRaw: boolean;
	showRawHandler: (showRaw: boolean) => void;
}

interface Props extends OwnProps, RecoveredProps {}

function MessageCardBase({ message, showRaw, showRawHandler }: Props) {
	const messagesStore = useMessagesWorkspaceStore();
	const selectedStore = useSelectedStore();
	const workspaceStore = useWorkspaceStore();
	const { heatmapElements } = useHeatmap();

	const heatmapElement = heatmapElements.find(el => el.id === message.messageId);
	const { messageId, timestamp, messageType, sessionId, direction, bodyBase64, body } = message;

	const isSelected = Boolean(heatmapElement);
	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isPinned = selectedStore.pinnedMessages.findIndex(m => m.messageId === messageId) !== -1;
	const isHighlighted = messagesStore.highlightedMessageId === messageId;

	const isAttached = !!workspaceStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);

	const color = heatmapElement?.colors[0];

	const rootClass = createBemBlock(
		'message-card',
		isSelected ? 'selected' : null,
		isAttached ? 'attached' : null,
		isPinned ? 'pinned' : null,
		isHighlighted ? 'highlighted' : null,
	);

	const showRawButtonClass = createStyleSelector(
		'mc-header__control-button mc-header__icon mc-header__show-raw-button',
		showRaw ? 'active' : null,
	);

	const beautifyButtonClass = createStyleSelector(
		'mc-header__control-button mc-header__icon mc-header__beatutify-button',
		isContentBeautified ? 'active' : null,
	);

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createStyleSelector(
		'mc-header__icon mc-header__direction-icon',
		direction?.toLowerCase(),
	);

	const bookmarkIconClass = createStyleSelector(
		'mc-header__icon mc-header__bookmark-button',
		isPinned ? 'pinned' : null,
	);

	return (
		<div className='message-card-wrapper'>
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
						{message.body !== null && (
							<div
								className={beautifyButtonClass}
								onClick={() => messagesStore.toggleMessageBeautify(messageId)}
							/>
						)}
						{bodyBase64 && bodyBase64 !== 'null' ? (
							<div className={showRawButtonClass} onClick={() => showRawHandler(!showRaw)} />
						) : null}
						<div
							className={bookmarkIconClass}
							title={isPinned ? 'Remove from bookmarks' : 'Add to bookmarks'}
							onClick={() => selectedStore.toggleMessagePin(message)}></div>
					</div>
				</div>
				<div className='mc__mc-body mc-body'>
					<div className='mc-body__human'>
						<ErrorBoundary
							fallback={
								<MessageBodyCardFallback
									isBeautified={isContentBeautified}
									isSelected={color !== undefined}
									body={body}
								/>
							}>
							<MessageBodyCard
								isBeautified={isContentBeautified}
								body={body}
								isSelected={color !== undefined}
							/>
						</ErrorBoundary>
						{bodyBase64 && showRaw ? (
							<MessageRaw messageId={messageId} rawContent={bodyBase64} />
						) : null}
					</div>
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
