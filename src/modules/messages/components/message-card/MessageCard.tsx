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
import { useMessageBodySortStore, useBookmarksStore } from 'hooks/index';
import StateSaver from 'components/util/StateSaver';
import { EventMessage, MessageViewTypeConfig } from 'models/EventMessage';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { getViewTypesConfig } from '../../helpers/message';
import { useMessagesViewTypeStore } from '../../hooks/useMessagesViewTypeStore';
import MessageCardBase from './MessageCardBase';
import MessageExpandButton from '../MessageExpandButton';
import 'styles/messages.scss';

export interface OwnProps {
	message: EventMessage;
	displayType: CardDisplayType;
}

export interface RecoveredProps {
	viewTypeConfig: Map<string, MessageViewTypeConfig>;
	isExpanded: boolean;
	isDisplayRuleRaw: boolean;
	setIsExpanded: (state: boolean) => void;
	stateKey: string;
}

interface Props extends OwnProps, RecoveredProps {}

const MessageCard = observer((props: Props) => {
	const { message } = props;
	const { id } = message;

	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();
	const bookmarksStore = useBookmarksStore();
	const { sortOrderItems } = useMessageBodySortStore();

	const [isHighlighted, setHighlighted] = React.useState(false);

	const highlightTimer = React.useRef<NodeJS.Timeout>();

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

	const isAttached = computed(
		() => !!messagesStore.attachedMessages.find(attMsg => attMsg.id === message.id),
	).get();

	const toogleMessagePin = React.useCallback(() => {
		bookmarksStore.toggleMessagePin(message);
	}, [bookmarksStore.toggleMessagePin]);

	const isExported = computed(() =>
		messagesStore.exportStore.exportMessages.includes(message),
	).get();

	const rootClass = createBemBlock(
		'messages-list__item',
		isSoftFiltered ? 'soft-filtered' : null,
		isExported ? 'exported' : null,
		isAttached ? 'attached' : null,
	);

	const isScreenshotMsg = false;

	return (
		<div className={rootClass}>
			<MessageCardBase
				{...props}
				addMessageToExport={messagesStore.exportStore.addMessageToExport}
				isExport={messagesStore.exportStore.isExport}
				toogleMessagePin={toogleMessagePin}
				isBookmarked={isBookmarked}
				isHighlighted={isHighlighted}
				sortOrderItems={sortOrderItems}
				isAttached={isAttached}
				isExported={isExported}
			/>
			{!isScreenshotMsg && (
				<MessageExpandButton
					isExpanded={props.isExpanded}
					setExpanded={props.setIsExpanded}
					isHighlighted={isHighlighted}
					isDisplayRuleRaw={Boolean(props.isDisplayRuleRaw && message.parsedMessages)}
					parsedMessages={message.parsedMessages}
				/>
			)}
		</div>
	);
});

const RecoverableMessageCard = (props: OwnProps) => {
	const viewTypesStore = useMessagesViewTypeStore();
	const { getSavedViewType } = viewTypesStore;

	const viewTypesConfig = getViewTypesConfig(props.message, getSavedViewType);

	const isDisplayRuleRaw = getSavedViewType(props.message).isDisplayRuleRaw;

	return (
		<StateSaver stateKey={props.message.id}>
			{(state: boolean, stateSaver) => (
				<MessageCard
					message={props.message}
					displayType={props.displayType}
					viewTypeConfig={viewTypesConfig}
					stateKey={props.message.id}
					setIsExpanded={stateSaver}
					isExpanded={state}
					isDisplayRuleRaw={isDisplayRuleRaw}
				/>
			)}
		</StateSaver>
	);
};

export default observer(RecoverableMessageCard);
