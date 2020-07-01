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
import { observer, Observer } from 'mobx-react-lite';
import EventWindow from './event/EventWindow';
import EventsWindowTab from './event/EventWindowTab';
import Tabs, { TabListRenderProps } from './tabs/Tabs';
import MessagesWindow from './message/MessagesWindow';
import MessagesWindowTab from './message/MessagesWindowTab';
import { EventWindowProvider } from '../contexts/eventWindowContext';
import { MessagesWindowProvider } from '../contexts/messagesWindowContext';
import { isEventsTab, isMessagesTab } from '../helpers/windows';
import AppWindowStore from '../stores/AppWindowStore';
import { useStores } from '../hooks/useStores';
import { TabTypes } from '../models/util/Windows';
import { TabDraggableItem } from './tabs/DraggableTab';
import WithSideDropTargets from './drag-n-drop/WithSideDropTargets';
import DroppableTabList from './tabs/DroppableTabList';
import { createStyleSelector } from '../helpers/styleCreators';

interface AppWindowProps {
	windowStore: AppWindowStore;
	windowIndex: number;
}

const AppWindow = (props: AppWindowProps) => {
	const {
		windowStore,
		windowIndex,
	} = props;
	const { windowsStore } = useStores();

	const renderTabs: TabListRenderProps = renderProps => {
		const { activeTabIndex, ...tabProps } = renderProps;

		const allTabs = windowsStore.windows.flatMap(({ tabs }) => tabs);

		const isEventsTabClosable = allTabs.filter(tab => isEventsTab(tab)).length > 1;
		const isMessagesTabClosable = allTabs.filter(tab => isMessagesTab(tab)).length > 1;

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
								isClosable={isEventsTabClosable}
								windowIndex={windowIndex}
								onTabDrop={windowsStore.moveTab}
								color={tab.store.color}
								{...tabProps}/>
						)}
					</Observer>
				);
			}
			return (
				<MessagesWindowTab
					key={`messages-tab-${index}`}
					dragItemPayload={{
						type: TabTypes.Messages,
						isSelected: activeTabIndex === index,
					}}
					tabIndex={index}
					isSelected={activeTabIndex === index}
					isClosable={isMessagesTabClosable}
					windowIndex={windowIndex}
					onTabDrop={windowsStore.moveTab}
					{...tabProps} />
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
		<WithSideDropTargets
			leftDropAreaEnabled={windowsStore.windows.length === 1}
			rightDropAreaEnabled={windowsStore.windows.length === 1}
			onDropLeft={(draggedTab: TabDraggableItem) =>
				windowsStore.moveTab(0, windowIndex - 1, draggedTab.tabIndex, 0)}
			onDropRight={(draggedTab: TabDraggableItem) =>
				windowsStore.moveTab(0, windowIndex + 1, draggedTab.tabIndex, 0)}
			offsetTop={50}>
			<Tabs
				activeIndex={windowStore.activeTabIndex}
				onChange={windowStore.setActiveTab}
				closeTab={windowStore.closeTab}
				duplicateTab={windowStore.duplicateTab}
				classNames={{
					tabsList: tabsClassName,
				}}
				tabList={tabListInjectedProps => (
					<DroppableTabList>
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
						</MessagesWindowProvider>))}/>
		</WithSideDropTargets>

	);
};

export default observer(AppWindow);
