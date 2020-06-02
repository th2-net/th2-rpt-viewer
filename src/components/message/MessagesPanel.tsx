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
import MessagesCardList from './MessagesCardList';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import SidePanel from '../SidePanel';
import { HeatmapProvider } from '../heatmap/HeatmapProvider';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import MessagesPanelControls from './MessagesPanelControls';

const MessagesPanel = observer(() => {
	const messagesStore = useMessagesStore();
	const windowViewStore = useEventWindowViewStore();

	return (
		<HeatmapProvider
			scrollToItem={(index: number) => messagesStore.scrolledIndex = new Number(index)}
			items={messagesStore.messagesIds}
			selectedItems={messagesStore.attachedMessagesIds}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={messagesStore.pinnedMessagesIds}>
			<SidePanel
				isOpen={windowViewStore.showMessages}
				onClose={() => windowViewStore.showMessages = false}>
				<div className="messages-panel">
					<MessagesPanelControls />
					<div className="messages-panel__list">
						<MessagesCardList />
					</div>
				</div>
			</SidePanel>
		</HeatmapProvider>
	);
});

export default MessagesPanel;
