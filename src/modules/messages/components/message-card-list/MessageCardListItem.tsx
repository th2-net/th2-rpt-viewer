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
import { createBemBlock } from 'helpers/styleCreators';
import CardDisplayType from 'models/util/CardDisplayType';
import StateSaver from 'components/util/StateSaver';
import { EventMessage, MessageViewType } from 'models/EventMessage';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { useMessagesViewTypeStore } from '../../hooks/useMessagesViewTypeStore';
import { useMessageBodySortStore } from '../../hooks/useMessageBodySortStore';
import MessageCard from '../message-card/MessageCard';
import 'styles/messages.scss';

export interface OwnProps {
	message: EventMessage;
	displayType: CardDisplayType;
}

export interface RecoveredProps {
	isExpanded: boolean;
	setIsExpanded: (state: boolean) => void;
	viewTypesMap: Map<string, MessageViewType>;
	setViewType: (id: string, vt: MessageViewType) => void;
}

interface Props extends OwnProps, RecoveredProps {}

const MessageCardListItem = observer((props: Props) => {
	const { message } = props;
	const { id } = message;

	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();
	const { sortOrderItems } = useMessageBodySortStore();

	const [isHighlighted, setHighlighted] = React.useState(false);

	const highlightTimer = React.useRef<NodeJS.Timeout>();

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

	const isBookmarked = computed(() => messagesStore.bookmarks.get(id)).get();

	const isSoftFiltered = messagesDataStore.isSoftFiltered.get(id);

	const isAttached = computed(() =>
		messagesStore.attachedMessages.some(attMsg => attMsg.id === message.id),
	).get();

	const isExported = computed(() =>
		messagesStore.exportStore.exportMessages.includes(message),
	).get();

	const toggleMessagePin = React.useCallback(() => {
		messagesStore.toggleBookmark(message);
	}, [messagesStore.toggleBookmark]);

	const rootClass = createBemBlock(
		'messages-list__item',
		isSoftFiltered ? 'soft-filtered' : null,
		isExported ? 'exported' : null,
		isAttached ? 'attached' : null,
	);

	return (
		<div className={rootClass}>
			<MessageCard
				{...props}
				addMessageToExport={messagesStore.exportStore.addMessageToExport}
				isExport={messagesStore.exportStore.isExport}
				toggleMessagePin={toggleMessagePin}
				isBookmarked={isBookmarked}
				isHighlighted={isHighlighted}
				sortOrderItems={sortOrderItems}
				isAttached={isAttached}
				isExported={isExported}
			/>
		</div>
	);
});

const RecoverableMessageCardListItem = (props: OwnProps) => {
	const viewTypesStore = useMessagesViewTypeStore();
	const { getSavedViewType } = viewTypesStore;

	const viewTypeStore = getSavedViewType(props.message);
	const viewTypesMap = viewTypeStore.viewTypes;
	const setViewType = viewTypeStore.setViewType;

	return (
		<StateSaver stateKey={props.message.id}>
			{(isExpanded: boolean, setIsExpanded) => (
				<MessageCardListItem
					message={props.message}
					displayType={props.displayType}
					isExpanded={isExpanded}
					setIsExpanded={setIsExpanded}
					viewTypesMap={viewTypesMap}
					setViewType={setViewType}
				/>
			)}
		</StateSaver>
	);
};

export default observer(RecoverableMessageCardListItem);
