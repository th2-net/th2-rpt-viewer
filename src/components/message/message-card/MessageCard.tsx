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
	useMessageBodySortStore,
} from '../../../hooks';
import { keyForMessage } from '../../../helpers/keys';
import StateSaver from '../../util/StateSaver';
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import { matchWildcardRule } from '../../../helpers/regexp';
import { MessageCardBase } from './MessageCardBase';
import '../../../styles/messages.scss';

export interface OwnProps {
	message: EventMessage;
	bodyHighlight?: string;
}

export interface RecoveredProps {
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
}

interface Props extends OwnProps, RecoveredProps {}

const MessageCard = observer(({ message, bodyHighlight, viewType, setViewType }: Props) => {
	const { messageId } = message;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const selectedStore = useSelectedStore();
	const { sortOrderItems } = useMessageBodySortStore();

	const [isHighlighted, setHighlighted] = React.useState(false);

	const highlightTimer = React.useRef<NodeJS.Timeout>();
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const isContentBeautified = messagesStore.beautifiedMessages.includes(messageId);
	const isBookmarked =
		selectedStore.bookmarkedMessages.findIndex(
			bookmarkedMessage => bookmarkedMessage.id === messageId,
		) !== -1;

	const isSoftFiltered = messagesDataStore.isSoftFiltered.get(messageId);
	const isDetailed = messagesStore.detailedRawMessagesIds.includes(messageId);

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

	const isExported = messagesStore.exportStore.isExported(message);

	return (
		<MessageCardBase
			message={message}
			bodyHighlight={bodyHighlight}
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
			isDetailed={isDetailed}
			isExported={isExported}
			isExport={messagesStore.exportStore.isExport}
			sortOrderItems={sortOrderItems}
			addMessageToExport={() => messagesStore.exportStore.addMessageToExport(message)}
		/>
	);
});

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
