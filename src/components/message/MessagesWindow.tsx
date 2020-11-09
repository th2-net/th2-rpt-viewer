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
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import MessagesCardList from './MessagesCardList';
import { useWindowsStore } from '../../hooks/useWindowsStore';
import { getTimestampAsNumber } from '../../helpers/date';

const MessagesWindow = () => {
	const messagesStore = useMessagesWindowStore();
	const windowsStore = useWindowsStore();

	const selectedItems = React.useMemo(() => {
		const heatmapElementsMap: Map<string, string[]> = new Map();
		windowsStore.selectedEvents
			.filter(e => e.attachedMessageIds.length !== 0)
			.forEach(({ eventId, attachedMessageIds }) => {
				const eventColor = windowsStore.eventColors.get(eventId);
				if (eventColor) {
					heatmapElementsMap.set(eventColor, attachedMessageIds);
				}
			});

		return heatmapElementsMap;
	}, [windowsStore.eventColors, messagesStore.messagesIds]);

	const unknownAreas = React.useMemo(() => {
		if (!messagesStore.messagesIds.length || messagesStore.filterStore.isMessagesFilterApplied) {
			return {
				before: [],
				after: [],
			};
		}
		const headMessage =
			messagesStore.attachedMessages.find(m => messagesStore.messagesIds.includes(m.messageId)) ||
			messagesStore.messagesCache.get(messagesStore.messagesIds[0]);

		if (!headMessage) {
			return { before: [], after: [] };
		}
		const notLoadedMessages = messagesStore.attachedMessages.filter(
			msg => !messagesStore.messagesIds.includes(msg.messageId),
		);

		const before = notLoadedMessages
			.filter(
				msg => getTimestampAsNumber(msg.timestamp) <= getTimestampAsNumber(headMessage.timestamp),
			)
			.map(msg => msg.messageId);
		const after = notLoadedMessages
			.filter(
				msg => getTimestampAsNumber(msg.timestamp) >= getTimestampAsNumber(headMessage.timestamp),
			)
			.map(msg => msg.messageId);

		return { before, after };
	}, [windowsStore.eventColors, messagesStore.messagesIds, messagesStore.messagesCache]);

	return (
		<HeatmapProvider
			items={messagesStore.messagesIds}
			unknownAreas={unknownAreas}
			selectedItems={selectedItems}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={windowsStore.pinnedMessages.map(m => m.messageId)}>
			<div className='layout'>
				<div className='layout__header'>
					<MessagesWindowHeader />
				</div>
				<div className='layout__body'>
					<MessagesCardList />
				</div>
			</div>
		</HeatmapProvider>
	);
};

export default observer(MessagesWindow);
