/* eslint-disable */
/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import { getHashCode } from '../../helpers/stringHash';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { keyForMessage } from '../../helpers/keys';
import StateSaver from '../util/StateSaver';
import { EventMessage } from '../../models/EventMessage';
import { useHeatmap } from '../../hooks/useHeatmap';
import { hexToRGBA } from '../../helpers/color';
import MessageRaw from './MessageRaw';
import { useStores } from '../../hooks/useStores';
import '../../styles/messages.scss';
import PanelArea from '../../util/PanelArea';
import MessageBodyCard, { MessageBodyCardFallback } from './MessageBodyCard';
import ErrorBoundary from '../util/ErrorBoundary';

const HUE_SEGMENTS_COUNT = 36;

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	showRaw: boolean;
	showRawHandler: (showRaw: boolean) => void;
}

interface Props extends OwnProps, RecoveredProps {
}

function MessageCardBase({ message, showRaw, showRawHandler }: Props) {
	const { windowsStore } = useStores();
	const messagesStore = useMessagesWindowStore();
	const { heatmapElements } = useHeatmap();

	const heatmapElement = heatmapElements.find(el => el.id === message.messageId);
	const {
		messageId,
		timestamp,
		messageType,
		sessionId,
		direction,
		bodyBase64,
		body,
	} = message;

	const isSelected = Boolean(heatmapElement);
	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isPinned = windowsStore.pinnedMessagesIds.includes(messageId);
	const color = heatmapElement?.color;

	const rootClass = createBemBlock(
		'message-card',
		isSelected ? 'selected' : null,
	);

	const headerClass = createBemBlock(
		'mc-header',
		PanelArea.P100,
	);

	const showRawClass = createBemElement(
		'mc-show-raw',
		'icon',
		showRaw ? 'expanded' : 'hidden',
	);

	const beautifyIconClass = createBemElement(
		'mc-beautify',
		'icon',
		isContentBeautified ? 'plain' : 'beautify',
	);

	// session arrow color, we calculating it for each session from-to pair, based on hash
	const sessionArrowStyle: React.CSSProperties = {
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(sessionId)}deg)`,
	};

	const sessionClass = createBemElement(
		'mc-header',
		'session-icon',
		direction?.toLowerCase(),
	);

	const pinClassName = createBemElement(
		'mc-header',
		'pin-icon',
		isPinned ? 'active' : null,
	);

	return (
		<div
			className={rootClass}
			style={{
				backgroundColor: color ? hexToRGBA(color, 15) : undefined,
				borderColor: color,
			}}>
			<div className={headerClass}>
				<div className="mc-header__name">Name</div>
				<div className="mc-header__name-value">
					{messageType}
				</div>
				<div className="mc-header__timestamp">
					{timestamp && formatTime(getTimestampAsNumber(timestamp))}
				</div>
				<div className="mc-header__session">Session</div>
				<div className="mc-header__session-value">
					<div className={sessionClass}
						 style={sessionArrowStyle}/>
					{sessionId}
				</div>
				{
					message.body !== null && (
						<div className="mc-beautify" onClick={() => messagesStore.toggleMessageBeautify(messageId)}>
							<div className={beautifyIconClass}/>
						</div>
					)
				}
				<div className="mc-header__pin">
					<div
						title={isPinned ? 'Unpin' : 'Pin'}
						className={pinClassName}
						onClick={() => windowsStore.toggleMessagePin(message)}/>
				</div>
				<div
					className="mc-header__underline"
					style={{ borderColor: color }}/>
			</div>
			<div className="message-card__body mc-body">
				<div className="mc-body__human">
					<ErrorBoundary fallback={
						<MessageBodyCardFallback
							isBeautified={isContentBeautified}
							body={body}/>
					}>
						<MessageBodyCard
							isBeautified={isContentBeautified}
							body={body}/>
					</ErrorBoundary>
					{
						(bodyBase64 && bodyBase64 !== 'null') ? (
							<div className="mc-show-raw"
								 onClick={() => showRawHandler(!showRaw)}>
								<div className="mc-show-raw__title">RAW</div>
								<div className={showRawClass}/>
							</div>
						) : null
					}
					{
						bodyBase64 && showRaw
							? <MessageRaw messageId={messageId} rawContent={bodyBase64}/>
							: null
					}
				</div>
			</div>
		</div>
	);
}

export const MessageCard = observer(MessageCardBase);

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

export const RecoverableMessageCard = (props: OwnProps) => (
	<StateSaver
		stateKey={keyForMessage(props.message.messageId)}
		getDefaultState={() => false}>
		{(state, saveState) => (
			<MessageCard
				{...props}
				// we should always show raw content if something found in it
				showRaw={state}
				showRawHandler={saveState}/>
		)}
	</StateSaver>
);

export default RecoverableMessageCard;
