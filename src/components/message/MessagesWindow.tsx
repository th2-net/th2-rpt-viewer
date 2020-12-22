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
import { useMessagesWorkspaceStore, useSelectedStore } from '../../hooks';
import MessagesCardList from './MessagesCardList';
import { getTimestampAsNumber } from '../../helpers/date';
import { useWorkspaceViewStore } from '../../hooks/useWorkspaceViewStore';

const MessagesWindow = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const selectedStore = useSelectedStore();
	const viewStore = useWorkspaceViewStore();

	const selectedItems = React.useMemo(() => {
		const heatmapElementsMap: Map<string, string[]> = new Map();
		selectedStore.selectedEvents
			.filter(e => e.attachedMessageIds.length !== 0)
			.forEach(({ eventId, attachedMessageIds }) => {
				const eventColor = selectedStore.eventColors.get(eventId);
				if (eventColor) {
					heatmapElementsMap.set(eventColor, attachedMessageIds);
				}
			});

		return heatmapElementsMap;
	}, [selectedStore.eventColors, messagesStore.messagesIds]);

	const unknownAreas = React.useMemo(() => {
		if (!messagesStore.messagesIds.length || messagesStore.filterStore.isMessagesFilterApplied) {
			return {
				before: [],
				after: [],
			};
		}
		const headMessage =
			selectedStore.attachedMessages.find(m => messagesStore.messagesIds.includes(m.messageId)) ||
			messagesStore.messagesCache.get(messagesStore.messagesIds[0]);

		if (!headMessage) {
			return { before: [], after: [] };
		}
		const notLoadedMessages = selectedStore.attachedMessages.filter(
			msg => !messagesStore.messagesIds.includes(msg.messageId),
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
	}, [selectedStore.eventColors, messagesStore.messagesIds]);

	return (
		<HeatmapProvider
			items={messagesStore.messagesIds}
			unknownAreas={unknownAreas}
			selectedItems={selectedItems}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={selectedStore.pinnedMessages.map(m => m.messageId)}>
			<div onClick={() => viewStore.setTargetPanel(messagesStore)} className='window'>
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
