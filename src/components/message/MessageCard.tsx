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
import Message from '../../models/Message';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { StatusType } from '../../models/Status';
import { getHashCode } from '../../helpers/stringHash';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { getTimestampAsNumber } from '../../helpers/date';
import { keyForMessage } from '../../helpers/keys';
import StateSaver from '../util/StateSaver';
import { PredictionData } from '../../models/MlServiceResponse';
import PanelArea from '../../util/PanelArea';
import { EventMessage } from '../../models/EventMessage';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import { useHeatmap } from '../../hooks/useHeatmap';
import { hexToRGBA } from '../../helpers/color';
import { MessageRaw } from './MessageRaw';
import '../../styles/messages.scss';

const HUE_SEGMENTS_COUNT = 36;

export interface MessageCardOwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	showRaw: boolean;
	showRawHandler: (showRaw: boolean) => void;
}

export interface MessageCardStateProps {
	rejectedMessagesCount: number;
	isSelected: boolean;
	isTransparent: boolean;
	panelArea: PanelArea;
	status: StatusType | null;
	adminEnabled: boolean;
	isContentBeautified: boolean;
	prediction: PredictionData | null;
	searchField: keyof Message | null;
	color: string | undefined;
	isPinned?: boolean;
	toggleMessagePin?: (message: EventMessage) => void;
}

export interface MessageCardDispatchProps {
	selectHandler: (status?: StatusType) => void;
	toggleBeautify: () => void;
}

export interface MessageCardProps extends MessageCardOwnProps,
	Omit<MessageCardStateProps, 'searchField'>,
	MessageCardDispatchProps,
	RecoveredProps {
}

export function MessageCardBase(props: MessageCardProps) {
	const {
		message,
		isSelected,
		isTransparent,
		status,
		selectHandler,
		isContentBeautified,
		toggleBeautify,
		panelArea,
		color,
		isPinned,
		toggleMessagePin,
		showRaw,
		showRawHandler,
	} = props;
	const {
		timestamp,
		type,
		sessionId,
		direction,
		bodyBase64,
	} = message;

	const rootClass = createBemBlock(
		'message-card',
		status,
		isSelected ? 'selected' : null,
		!isSelected && isTransparent ? 'transparent' : null,
	);

	const headerClass = createBemBlock(
		'mc-header',
		panelArea,
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
			<div className={headerClass}
				 onClick={() => selectHandler()}>
				<div className="mc-header__name">
					<span>Name</span>
				</div>
				<div className="mc-header__name-value">
					{type}
				</div>
				<div className="mc-header__timestamp">
					<p>
						{timestamp
						&& new Date(getTimestampAsNumber(timestamp)).toISOString().replace('T', ' ')}
					</p>
				</div>
				<div className="mc-header__session">
					<span>Session</span>
				</div>
				<div className="mc-header__session-value">
					<div className={sessionClass}
						 style={sessionArrowStyle}/>
					{sessionId}
				</div>
				{
					message.body !== null
					&& 	<div className="mc-beautify" onClick={() => toggleBeautify()}>
						<div className={beautifyIconClass}/>
				   </div>
				}
				<div className="mc-header__pin">
					<div
						title={isPinned ? 'Unpin' : 'Pin'}
						className={pinClassName}
						onClick={() => {
							if (toggleMessagePin) {
								toggleMessagePin(message);
							}
						}}/>
				</div>
				<div
					className="mc-header__underline"
					style={{
						borderColor: color,
					}}/>
			</div>
			<div className="message-card__body mc-body">
				<div className="mc-body__human">
					{
						isContentBeautified ? (
							<pre>
								{JSON.stringify(message.body, undefined, '  ')}
							</pre>
						) : (
							<pre className="mc-body__human">
								{JSON.stringify(message.body)}
							</pre>
						)
					}
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
							? <MessageRaw
								rawContent={bodyBase64}
								messageId={message.messageId as any}/>
							: null
					}
				</div>
			</div>
		</div>
	);
}

function calculateHueValue(session: string): number {
	const hashCode = getHashCode(session);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

const MESSAGE_RAW_FIELDS: (keyof Message)[] = ['rawHex', 'rawHumanReadable'];

export const RecoverableMessageCard = ({
	searchField,
	...props
}: MessageCardStateProps & MessageCardOwnProps & MessageCardDispatchProps) => (
	<StateSaver
		stateKey={keyForMessage(props.message.messageId as any)}
		getDefaultState={() => false}>
		{(state, saveState) => (
			<MessageCardBase
				{...props}
				// we should always show raw content if something found in it
				showRaw={MESSAGE_RAW_FIELDS.includes(searchField!) || state}
				showRawHandler={saveState}/>
		)}
	</StateSaver>
);

export const MessageCard = observer(({ message }: MessageCardOwnProps) => {
	const viewStore = useEventWindowViewStore();
	const messagesStore = useMessagesStore();
	const { heatmapElements } = useHeatmap();

	const heatmapElement = heatmapElements.find(el => el.id === message.messageId);

	return (
		<RecoverableMessageCard
			isSelected={Boolean(heatmapElement)}
			color={heatmapElement?.color}
			status={null}
			isTransparent={false}
			rejectedMessagesCount={0}
			adminEnabled={true}
			panelArea={viewStore.panelArea}
			isContentBeautified={viewStore.beautifiedMessages.includes(message.messageId)}
			prediction={null}
			searchField={null}
			selectHandler={() => 'stub'}
			toggleBeautify={() => viewStore.toggleBeautify(message.messageId)}
			message={message}
			isPinned={messagesStore.pinnedMessagesIds.includes(message.messageId)}
			toggleMessagePin={messagesStore.toggleMessagePin}
		/>
	);
});

export default MessageCard;
