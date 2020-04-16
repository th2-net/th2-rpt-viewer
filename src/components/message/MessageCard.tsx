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
import { useStores } from '../../hooks/useStores';
import Message from '../../models/Message';
import { StatusType } from '../../models/Status';
import { MessageRaw } from './MessageRaw';
import { getHashCode } from '../../helpers/stringHash';
import { MessageCardActionChips } from './MessageCardActionChips';
import { MlUploadButton } from '../machinelearning/MlUploadButton';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import { isRejected } from '../../helpers/message';
import SearchableContent from '../search/SearchableContent';
import { keyForMessage } from '../../helpers/keys';
import { MessagePredictionIndicator } from '../machinelearning/MlPredictionIndicator';
import StateSaver from '../util/StateSaver';
import ErrorBoundary from '../util/ErrorBoundary';
import BeautifiedContent from './BeautifiedContent';
import { PredictionData } from '../../models/MlServiceResponse';
import PanelArea from '../../util/PanelArea';
import '../../styles/messages.scss';

const HUE_SEGMENTS_COUNT = 36;

export interface MessageCardOwnProps {
    message: Message;
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
		rejectedMessagesCount,
		selectHandler,
		showRaw,
		showRawHandler,
		isContentBeautified,
		toggleBeautify,
		prediction,
		panelArea,
	} = props;
	const {
		id, msgName, timestamp, from, to, contentHumanReadable, raw,
	} = message;
	const rejectedTitle = message.content.rejectReason;
	const labels = renderMessageTypeLabels(message, prediction);
	const labelsCount = labels.length;

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
	const sessionArrowStyle = {
		filter: `invert(1) sepia(1) saturate(5) hue-rotate(${calculateHueValue(from, to)}deg)`,
	};

	return (
		<div className={rootClass} data-lb-count={labelsCount}>
			<div className="message-card__labels">
				{labels}
			</div>
			<div className={headerClass}
				onClick={() => selectHandler()}>
				{
					rejectedMessagesCount && !(message.relatedActions?.length > 0)
						? (
							<div className="mc-header__info rejected">
								<p>Rejected {rejectedMessagesCount}</p>
							</div>
						) : (
							<MessageCardActionChips
								message={message}/>
						)
				}
				<div className="mc-header__name">
					<span>Name</span>
				</div>
				<div className="mc-header__name-value">
					<SearchableContent
						content={msgName}
						contentKey={keyForMessage(id, 'msgName')}/>
				</div>
				<div className="mc-header__timestamp">
					<p>{timestamp}</p>
				</div>
				<div className="mc-header__session">
					<span>Session</span>
				</div>
				<div className="mc-header__session-value">
					<SearchableContent
						content={from}
						contentKey={keyForMessage(id, 'from')}/>
					{
						from && to ? (
							<div className="mc-header__session-icon"
								style={sessionArrowStyle}/>
						) : null
					}
					<SearchableContent
						content={to}
						contentKey={keyForMessage(id, 'to')}/>
				</div>
				<MlUploadButton messageId={message.id}/>
			</div>
			<div className="message-card__body   mc-body">
				{
					message.content.rejectReason !== null ? (
						<div className="mc-body__title">
							<p>{rejectedTitle}</p>
						</div>
					) : null
				}
				<div className="mc-body__human">
					<div className="mc-beautify" onClick={() => toggleBeautify()}>
						<div className={beautifyIconClass}/>
					</div>
					{
						isContentBeautified ? (
							<ErrorBoundary
								errorMessage="Can't parse message.">
								<BeautifiedContent
									content={contentHumanReadable}
									msgId={id}/>
							</ErrorBoundary>
						) : (
							<SearchableContent
								content={contentHumanReadable}
								contentKey={keyForMessage(id, 'contentHumanReadable')}/>
						)
					}
					{
						(raw && raw !== 'null') ? (
							<div className="mc-show-raw"
								onClick={() => showRawHandler(!showRaw)}>
								<div className="mc-show-raw__title">RAW</div>
								<div className={showRawClass}/>
							</div>
						) : null
					}
					{
						showRaw
							? <MessageRaw
								rawContent={raw}
								messageId={message.id}/>
							: null
					}
				</div>
			</div>
		</div>
	);
}

function renderMessageTypeLabels(message: Message, prediction: PredictionData | null): React.ReactNodeArray {
	const labels = [];

	if (prediction) {
		labels.push(
			<MessagePredictionIndicator prediction={prediction} key="prediction"/>,
		);
	}

	if (message.content.rejectReason !== null) {
		labels.push(
			<div className="mc-label rejected" key="rejected">
				<div className="mc-label__icon rejected"/>
			</div>,
		);
	}

	if (message.content.admin) {
		labels.push(
			<div className="mc-label admin" key="admin">
				<div className="mc-label__icon admin"/>
			</div>,
		);
	}

	return labels;
}

function calculateHueValue(from: string, to: string): number {
	const hashCode = getHashCode(
		[from, to]
			.filter(Boolean)
			.sort((a, b) => a.localeCompare(b))
			.join(''),
	);

	return (hashCode % HUE_SEGMENTS_COUNT) * (360 / HUE_SEGMENTS_COUNT);
}

const MESSAGE_RAW_FIELDS: (keyof Message)[] = ['rawHex', 'rawHumanReadable'];

export const RecoverableMessageCard = ({
	searchField,
	...props
}: MessageCardStateProps & MessageCardOwnProps & MessageCardDispatchProps) => (
	<StateSaver
		stateKey={keyForMessage(props.message.id)}
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
	const { viewStore, selectedStore, mlStore } = useStores();

	return <RecoverableMessageCard
		isSelected={selectedStore.messagesId.includes(message.id) || selectedStore.rejectedMessageId === message.id}
		status={selectedStore.messagesId.includes(message.id) ? selectedStore.selectedActionStatus : null}
		isTransparent={false}
		rejectedMessagesCount={isRejected(message) ? selectedStore.rejectedMessages.indexOf(message) + 1 : 0}
		adminEnabled={viewStore.adminMessagesEnabled.valueOf()}
		panelArea={viewStore.panelArea}
		isContentBeautified={viewStore.beautifiedMessages.includes(message.id)}
		prediction={mlStore.predictionsEnabled
			? mlStore.predictionData.find(prediction =>
				prediction.actionId === selectedStore.activeActionId && prediction.messageId === message.id)! : null}
		searchField={null}
		selectHandler={(status?: StatusType) => selectedStore.selectMessage(message, status)}
		toggleBeautify={() => viewStore.toggleBeautify(message.id)}
		message={message}
	/>;
});

export default MessageCard;
