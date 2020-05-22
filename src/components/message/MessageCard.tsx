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
import { useMessagesHeatmap } from '../../hooks/useMessagesHeatmap';
import { lighten } from '../../helpers/color';
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
	} = props;
	const {
		timestamp,
		type,
		sessionId,
		direction,
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
	// const showRawClass = createBemElement(
	// 	'mc-show-raw',
	// 	'icon',
	// 	showRaw ? 'expanded' : 'hidden',
	// );
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

	return (
		<div
			className={rootClass}
			style={{
				backgroundColor: color ? lighten(color, 47) : undefined,
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
			</div>
			<div className="message-card__body   mc-body">
				<div className="mc-body__human">
					<div className="mc-beautify" onClick={() => toggleBeautify()}>
						<div className={beautifyIconClass}/>
					</div>
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
	const { heatmapElements } = useMessagesHeatmap();

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
		/>
	);
});

export default MessageCard;
