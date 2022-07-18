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
	useMessagesViewTypeStore,
} from '../../../hooks';
import { EventMessage, MessageViewTypeConfig } from '../../../models/EventMessage';
import MessageCardBase, { MessageCardBaseProps } from './MessageCardBase';
import '../../../styles/messages.scss';
import MessageExpandButton from '../MessageExpandButton';
import StateSaver from '../../util/StateSaver';
import { getViewTypesConfig } from '../../../helpers/message';

export interface OwnProps {
	message: EventMessage;
}

export interface RecoveredProps {
	viewTypesConfig: MessageViewTypeConfig[];
	isExpanded: boolean;
	setIsExpanded: (state: boolean) => void;
	stateKey: string;
}

interface Props extends OwnProps, RecoveredProps {}

export const MessageCard = observer((props: Props) => {
	const { message, viewTypesConfig } = props;
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

	const messageCardBaseProps: MessageCardBaseProps = {
		message,
		viewTypeConfig: viewTypesConfig,
		hoverMessage,
		unhoverMessage,
		addMessagesToExport,
		isHighlighted,
		isSoftFiltered,
		isExported,
		isExpanded: props.isExpanded,
		isExport: messagesStore.exportStore.isExport,
		isBookmarked,
		isAttached,
		toogleMessagePin,
		sortOrderItems,
	};

	return (
		<div className='messages-list__item'>
			<MessageCardBase {...messageCardBaseProps} />
			<MessageExpandButton
				isExpanded={props.isExpanded}
				setExpanded={props.setIsExpanded}
				parsedMessages={message.parsedMessages}
			/>
		</div>
	);
});

const RecoverableMessageCard = (props: OwnProps) => {
	const viewTypesStore = useMessagesViewTypeStore();
	const { getSavedViewType, setViewType } = viewTypesStore;
	const viewTypesConfig = getViewTypesConfig(props.message, setViewType, getSavedViewType);

	return (
		<StateSaver stateKey={props.message.id}>
			{(state: boolean, stateSaver) => (
				<MessageCard
					message={props.message}
					viewTypesConfig={viewTypesConfig}
					stateKey={props.message.id}
					setIsExpanded={stateSaver}
					isExpanded={state}
				/>
			)}
		</StateSaver>
	);
};

export default observer(RecoverableMessageCard);
