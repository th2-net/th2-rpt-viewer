/** *****************************************************************************
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
import { observer, Observer } from 'mobx-react-lite';
import EventWindow from './event/EventWindow';
import EventsWindowTab from './event/EventWindowTab';
import Tabs, { TabListRenderProps } from './tabs/Tabs';
import MessagesWindow from './message/MessagesWindow';
import MessagesWindowTab from './message/MessagesWindowTab';
import { EventWindowProvider } from '../contexts/eventWindowContext';
import { MessagesWindowProvider } from '../contexts/messagesWindowContext';
import { isEventsTab } from '../helpers/windows';
import AppWindowStore from '../stores/AppWindowStore';
import { TabTypes } from '../models/util/Windows';
import { TabDraggableItem } from './tabs/DraggableTab';
import { withSideDropTargets } from './drag-n-drop/WithSideDropTargets';
import DroppableTabList from './tabs/DroppableTabList';
import { createStyleSelector } from '../helpers/styleCreators';
import { useWindowsStore } from '../hooks/useWindowsStore';

interface AppWindowProps {
	windowStore: AppWindowStore;
	windowIndex: number;
}

const TabsWithSideDropTargets = withSideDropTargets(Tabs);

const AppWindow = (props: AppWindowProps) => {
	const {
		windowStore,
		windowIndex,
	} = props;
	const windowsStore = useWindowsStore();

	const renderTabs: TabListRenderProps = renderProps => {
		const { activeTabIndex, ...tabProps } = renderProps;

		const eventTabsCount = windowStore.tabs.filter(isEventsTab).length;

		return windowStore.tabs.map((tab, index) => {
			if (isEventsTab(tab)) {
				return (
					<Observer key={`events-tab-${index}`}>
						{() => (
							<EventsWindowTab
								store={tab.store}
								dragItemPayload={{
									type: TabTypes.Events,
									store: tab.store,
									isSelected: activeTabIndex === index,
								}}
								tabIndex={index}
								isSelected={activeTabIndex === index}
								isClosable={windowsStore.isEventsTabClosable}
								isDuplicable={windowsStore.isDuplicable}
								windowIndex={windowIndex}
								onTabDrop={windowsStore.moveTab}
								tabCount={windowStore.tabs.length}
								{...tabProps} />
						)}
					</Observer>
				);
			}
			return (
				<Observer key={`messages-tab-${index}`}>
					{() => (
						<MessagesWindowTab
							style={{
								maxWidth: eventTabsCount === 0 ? '100%' : '200px',
								width: eventTabsCount === 0 ? 'auto' : '20%',
							}}
							dragItemPayload={{
								type: TabTypes.Messages,
								isSelected: activeTabIndex === index,
							}}
							tabIndex={index}
							isSelected={activeTabIndex === index}
							isClosable={windowsStore.isMessagesTabClosable}
							windowIndex={windowIndex}
							isDuplicable={windowsStore.isDuplicable}
							onTabDrop={windowsStore.moveTab}
							tabCount={windowStore.tabs.length}
							{...tabProps} />
					)}
				</Observer>
			);
		});
	};

	const tabsClassName = createStyleSelector(
		'window-tabs',
		windowsStore.windows.length > 1
			? windowIndex === 0 ? 'attach-right' : 'attach-left'
			: null,
	);

	return (
		<TabsWithSideDropTargets
			leftDropAreaEnabled={windowsStore.windows.length === 1}
			rightDropAreaEnabled={windowsStore.windows.length === 1}
			onDropLeft={(draggedTab: TabDraggableItem) =>
				windowsStore.moveTab(windowIndex, windowIndex - 1, draggedTab.tabIndex)}
			onDropRight={(draggedTab: TabDraggableItem) =>
				windowsStore.moveTab(windowIndex, windowIndex + 1, draggedTab.tabIndex)}
			offsetTop={50}
			activeIndex={windowStore.activeTabIndex}
			onChange={windowStore.setActiveTab}
			closeTab={windowStore.closeTab}
			duplicateTab={windowStore.duplicateTab}
			tabList={tabListInjectedProps => (
				<DroppableTabList className={tabsClassName}>
					{renderTabs(tabListInjectedProps)}
				</DroppableTabList>
			)}
			tabPanels={windowStore.tabs.map(tab =>
				(isEventsTab(tab)
					? <EventWindowProvider value={tab.store}>
						<EventWindow />
					</EventWindowProvider>
					: <MessagesWindowProvider value={tab.store} >
						<MessagesWindow />
					</MessagesWindowProvider>))
			} />
	);
};

export default observer(AppWindow);
