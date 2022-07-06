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
	useMessagesDataStore,
	useMessageBodySortStore,
	useBookmarksStore,
	useMessagesViewStore,
} from '../../../hooks';
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import MessageCardBase from './MessageCardBase';
import '../../../styles/messages.scss';
import MessageExpandButton from '../MessageExpandButton';
import { SavedMessageViewType } from '../../../stores/messages/SavedMessageViewType';

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	viewTypes?: MessageViewType[];
	getSavedViewType: (message: EventMessage, parsedMessageId: string) => SavedMessageViewType;
	setExpandedMessage: (message: EventMessage) => void;
	isExpanded: boolean;
}

interface Props extends OwnProps, RecoveredProps {}

const MessageCard = observer((props: Props) => {
	const { message, viewTypes, getSavedViewType, setExpandedMessage, isExpanded } = props;
	const { id } = message;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const bookmarksStore = useBookmarksStore();
	const { sortOrderItems } = useMessageBodySortStore();

	const [isHighlighted, setHighlighted] = React.useState(false);

	const highlightTimer = React.useRef<NodeJS.Timeout>();
	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const isBookmarked =
		bookmarksStore.messages.findIndex(bookmarkedMessage => bookmarkedMessage.id === id) !== -1;

	const isSoftFiltered = messagesDataStore.isSoftFiltered.get(id);

	React.useEffect(() => {
		const abortController = new AbortController();

		if (
			messagesStore.filterStore.isSoftFilter &&
			messagesDataStore.isSoftFiltered.get(id) === undefined
		) {
			messagesDataStore.matchMessage(id, abortController.signal);
		}

		return () => {
			abortController.abort();
		};
	}, []);

	React.useEffect(() => {
		if (!isHighlighted && messagesStore.highlightedMessageId?.valueOf() === id) {
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

	const addMessagesToExport = React.useCallback(
		() => messagesStore.exportStore.addMessageToExport(message),
		[messagesStore.exportStore.addMessageToExport],
	);

	const isAttached = computed(
		() => !!messagesStore.attachedMessages.find(attMsg => attMsg.id === message.id),
	).get();

	const toogleMessagePin = React.useCallback(() => {
		bookmarksStore.toggleMessagePin(message);
	}, [bookmarksStore.toggleMessagePin]);

	const isExported = messagesStore.exportStore.isExported(message);

	return (
		<div className='messages-list__item'>
			<MessageCardBase
				message={message}
				viewTypes={viewTypes}
				getSavedViewType={getSavedViewType}
				hoverMessage={hoverMessage}
				unhoverMessage={unhoverMessage}
				addMessagesToExport={addMessagesToExport}
				isHighlighted={isHighlighted}
				isSoftFiltered={isSoftFiltered}
				isExported={isExported}
				isExport={messagesStore.exportStore.isExport}
				isExpanded={isExpanded}
				isBookmarked={isBookmarked}
				isAttached={isAttached}
				toogleMessagePin={toogleMessagePin}
				sortOrderItems={sortOrderItems}
			/>
			<MessageExpandButton
				message={message}
				isExpanded={isExpanded}
				setExpanded={setExpandedMessage}
			/>
		</div>
	);
});

const RecoverableMessageCard = (props: OwnProps) => {
	const viewStore = useMessagesViewStore();
	const { getSavedViewType, expandedMessages, setExpandedMessage } = viewStore;

	const viewTypes = props.message.parsedMessages?.map(
		parsedMessage => getSavedViewType(props.message, parsedMessage.id).viewType,
	);

	const isExpanded = expandedMessages.includes(props.message.id);

	return (
		<MessageCard
			{...props}
			viewTypes={viewTypes}
			getSavedViewType={getSavedViewType}
			setExpandedMessage={setExpandedMessage}
			isExpanded={isExpanded}
		/>
	);
};

export default observer(RecoverableMessageCard);
