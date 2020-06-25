/** *****************************************************************************
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import EventWindow from './event/EventWindow';
import EventsWindowTab from './event/EventWindowTab';
import Tabs from './tabs/Tabs';
import MessagesWindow from './message/MessagesWindow';
import MessagesWindowTab from './message/MessagesWindowTab';
import { EventWindowProvider } from '../contexts/eventWindowContext';
import { MessagesWindowProvider } from '../contexts/messagesWindowContext';
import { isEventsTab, isMessagesTab } from '../helpers/windows';
import AppWindowStore from '../stores/AppWindowStore';

interface AppWindowProps {
	windowStore: AppWindowStore;
	windowIndex: number;
}

const AppWindow = ({
	windowStore,
	windowIndex,
}: AppWindowProps) => (
	<Tabs
		activeIndex={windowStore.activeTabIndex}
		onChange={windowStore.setActiveTab}
		closeTab={windowStore.closeTab}
		duplicateTab={windowStore.duplicateTab}
		tabList={({ activeTabIndex, ...tabProps }) =>
			windowStore.tabs.map((tab, index) =>
				(isEventsTab(tab)
					? <EventsWindowTab
						store={tab.store}
						key={index}
						isSelected={activeTabIndex === index}
						{...tabProps}
						tabIndex={index}
						isClosable={windowStore.tabs.filter(w => isEventsTab(w)).length > 1}
						windowIndex={windowIndex}/>
					: <MessagesWindowTab
						key={index}
						isSelected={activeTabIndex === index}
						{...tabProps}
						tabIndex={index}
						isClosable={windowStore.tabs.filter(w => isMessagesTab(w)).length > 1}
						windowIndex={windowIndex}/>))}
		tabPanels={windowStore.tabs.map(tab =>
			(isEventsTab(tab)
				? <EventWindowProvider value={tab.store}>
					<EventWindow />
				</EventWindowProvider>
				: <MessagesWindowProvider value={tab.store} >
					<MessagesWindow />
				</MessagesWindowProvider>))}/>
);

export default observer(AppWindow);
