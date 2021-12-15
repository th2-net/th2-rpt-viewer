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
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import { matchWildcardRule } from '../../../helpers/regexp';
import MessageCardBase from './MessageCardBase';
import '../../../styles/messages.scss';
import savedViewTypesStore from '../../../stores/messages/SavedMessagesViewTypesStore';
import { SavedMessageViewType } from '../../../stores/messages/SavedMessageViewType';
import { keyForMessage } from '../../../helpers/keys';

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	viewType: MessageViewType;
	setViewType: (viewType: MessageViewType) => void;
}

interface Props extends OwnProps, RecoveredProps {}

const MessageCard = observer(({ message, viewType, setViewType }: Props) => {
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

	const hoverMessage = React.useCallback(() => {
		hoverTimeout.current = setTimeout(() => {
			messagesStore.setHoveredMessage(message);
		}, 600);
	}, [messagesStore.setHoveredMessage]);

	const unhoverMessage = React.useCallback(() => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		messagesStore.setHoveredMessage(null);
	}, [messagesStore.setHoveredMessage]);

	const isAttached = !!messagesStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);

	const toogleMessagePin = React.useCallback(() => {
		selectedStore.toggleMessagePin(message);
	}, [selectedStore.toggleMessagePin]);

	const addMessagesToExport = React.useCallback(
		() => messagesStore.exportStore.addMessageToExport(message),
		[messagesStore.exportStore.addMessageToExport],
	);

	const isExported = messagesStore.exportStore.isExported(message);

	return (
		<MessageCardBase
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
			isDetailed={isDetailed}
			isExported={isExported}
			isExport={messagesStore.exportStore.isExport}
			sortOrderItems={sortOrderItems}
			addMessageToExport={addMessagesToExport}
		/>
	);
});

const RecoverableMessageCard = (props: OwnProps) => {
	const { rootDisplayRule, messageDisplayRules } = useMessageDisplayRulesStore();
	const key = keyForMessage(props.message.messageId);
	const savedState = savedViewTypesStore.getSavedViewType(key);

	const declaredRule = React.useMemo(
		() =>
			messageDisplayRules.find(rule => {
				if (rule.session.length > 1 && rule.session.includes('*')) {
					return matchWildcardRule(props.message.sessionId, rule.session);
				}
				return props.message.sessionId.includes(rule.session);
			}),
		[messageDisplayRules],
	);

	const defaultViewType = React.useMemo(() => {
		if (!props.message.body) {
			return declaredRule
				? getRawViewType(declaredRule.viewType)
				: rootDisplayRule
				? getRawViewType(rootDisplayRule.viewType)
				: MessageViewType.ASCII;
		}
		return declaredRule
			? declaredRule.viewType
			: rootDisplayRule
			? rootDisplayRule.viewType
			: MessageViewType.JSON;
	}, [rootDisplayRule?.viewType, declaredRule?.viewType]);

	const [viewType, setViewType] = React.useState(defaultViewType);

	React.useEffect(() => {
		setViewType(defaultViewType);
	}, [defaultViewType]);

	return (
		<MessageCard
			message={props.message}
			viewType={savedState?.viewType || viewType}
			setViewType={
				savedState
					? (v: MessageViewType) => {
							savedState.setViewType(v);
					  }
					: (v: MessageViewType) => {
							setViewType(v);
							savedViewTypesStore.saveViewType(key, new SavedMessageViewType(v));
					  }
			}
		/>
	);
};

RecoverableMessageCard.displayName = 'RecoverableMessageCard';

export default observer(RecoverableMessageCard);

function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

function getRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}
