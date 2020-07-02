/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { useStores } from '../../hooks/useStores';

const MessagesWindow = () => (
	<div className="layout">
		<div className="layout__header">
			<MessagesWindowHeader />
		</div>
		<div className="layout__body">
			<MessagesCardList />
		</div>
	</div>
);

export default observer(() => {
	const messagesStore = useMessagesWindowStore();
	const { windowsStore } = useStores();

	const selectedItems = React.useMemo(
		() => new Map(windowsStore.eventsAttachedMessages.map(({ color, messagesIds }) => [color, messagesIds])),
		[windowsStore.eventsAttachedMessages],
	);

	return (
		<HeatmapProvider
			scrollToItem={(index: number) => messagesStore.scrolledIndex = new Number(index)}
			items={messagesStore.messagesIds}
			selectedItems={selectedItems}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={windowsStore.pinnedMessagesIds}>
			<MessagesWindow />
		</HeatmapProvider>
	);
});
