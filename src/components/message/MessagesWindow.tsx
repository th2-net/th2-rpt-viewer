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

import React from 'react';
import { observer } from 'mobx-react-lite';
import MessagesWindowHeader from './MessagesWindowHeader';
import { HeatmapProvider } from '../heatmap/HeatmapProvider';
import {
	useMessagesWorkspaceStore,
	useSelectedStore,
	useActivePanel,
	useWorkspaceStore,
	useMessagesDataStore,
} from '../../hooks';
import MessagesCardList from './message-card-list/MessagesCardList';
import { getTimestampAsNumber } from '../../helpers/date';
import { isWorkspaceStore } from '../../helpers/workspace';

const MessagesWindow = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const workspaceStore = useWorkspaceStore();
	const selectedStore = useSelectedStore();

	const { ref: panelRef } = useActivePanel(messagesStore);

	const selectedItems = React.useMemo(() => {
		const heatmapElementsMap: Map<string, string[]> = new Map();
		heatmapElementsMap.set(
			'#FC8144',
			isWorkspaceStore(workspaceStore) ? workspaceStore.attachedMessagesIds : [],
		);

		return heatmapElementsMap;
	}, [isWorkspaceStore(workspaceStore) ? workspaceStore.attachedMessagesIds : null]);

	const unknownAreas = React.useMemo(() => {
		const messages = messagesDataStore.messages;
		if (!messages.length || messagesStore.filterStore.isMessagesFilterApplied) {
			return {
				before: [],
				after: [],
			};
		}
		const headMessage =
			selectedStore.attachedMessages.find(attachedMessage =>
				messages.find(msg => attachedMessage.messageId === msg.messageId),
			) || messages[0];

		if (!headMessage) {
			return { before: [], after: [] };
		}
		const notLoadedMessages = selectedStore.attachedMessages.filter(
			msg => messages.findIndex(m => m.messageId === msg.messageId) === -1,
		);

		const before = notLoadedMessages
			.filter(
				msg =>
					getTimestampAsNumber(msg.timestamp) < getTimestampAsNumber(headMessage.timestamp) ||
					(getTimestampAsNumber(msg.timestamp) === getTimestampAsNumber(headMessage.timestamp) &&
						selectedStore.attachedMessages.indexOf(msg) <
							selectedStore.attachedMessages.indexOf(headMessage)),
			)
			.map(msg => msg.messageId);
		const after = notLoadedMessages
			.filter(
				msg =>
					getTimestampAsNumber(msg.timestamp) > getTimestampAsNumber(headMessage.timestamp) ||
					(getTimestampAsNumber(msg.timestamp) === getTimestampAsNumber(headMessage.timestamp) &&
						selectedStore.attachedMessages.indexOf(msg) >
							selectedStore.attachedMessages.indexOf(headMessage)),
			)
			.map(msg => msg.messageId);

		return { before, after };
	}, [messagesDataStore.messages]);

	const messagesIds: string[] = React.useMemo(
		() => messagesDataStore.messages.map(m => m.messageId),
		[messagesDataStore.messages],
	);

	return (
		<HeatmapProvider
			items={messagesIds}
			unknownAreas={unknownAreas}
			selectedItems={selectedItems}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={selectedStore.pinnedMessages.map(m => m.messageId)}>
			<div className='window' ref={panelRef}>
				<div className='window__controls'>
					<MessagesWindowHeader />
				</div>
				<div className='window__body'>
					<MessagesCardList />
				</div>
			</div>
		</HeatmapProvider>
	);
};

export default observer(MessagesWindow);
