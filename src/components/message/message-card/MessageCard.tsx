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
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
	useMessagesWorkspaceStore,
	useSelectedStore,
	useMessagesDataStore,
	useMessageBodySortStore,
	useMessagesViewTypesStore,
} from '../../../hooks';
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardBase from './MessageCardBase';
import '../../../styles/messages.scss';

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

	const isContentBeautified = viewType === MessageViewType.FORMATTED;
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
		if (!isHighlighted && messagesStore.highlightedMessageId?.valueOf() === messageId) {
			setHighlighted(true);

			highlightTimer.current = setTimeout(() => {
				setHighlighted(false);
				messagesStore.highlightedMessageId = null;
			}, 3000);
		}

		return () => {
			if (highlightTimer.current) {
				window.clearTimeout(highlightTimer.current);
			}
			setHighlighted(false);
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

	const isAttached = computed(
		() => !!messagesStore.attachedMessages.find(attMsg => attMsg.messageId === message.messageId),
	).get();

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
			isExported={isExported}
			isExport={messagesStore.exportStore.isExport}
			sortOrderItems={sortOrderItems}
			addMessageToExport={addMessagesToExport}
		/>
	);
});

const RecoverableMessageCard = (props: OwnProps) => {
	const viewTypesStore = useMessagesViewTypesStore();
	const { viewType, setViewType } = viewTypesStore.getSavedViewType(props.message);

	return <MessageCard {...props} viewType={viewType} setViewType={setViewType} />;
};

export default observer(RecoverableMessageCard);
