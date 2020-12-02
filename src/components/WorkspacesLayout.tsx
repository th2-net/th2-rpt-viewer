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
import { Observer, observer } from 'mobx-react-lite';
import Workspace from './Workspace';
import { WorkspaceContextProvider } from '../contexts/workspaceContext';
import { useWindowsStore } from '../hooks';
import EventsWindowTab from './event/EventsWindowTab';
import Tabs, { TabListRenderProps } from './tabs/Tabs';
import { TabTypes } from '../models/util/Windows';
import DroppableTabList from './tabs/DroppableTabList';
import '../styles/root.scss';

const WorkspacesLayout = () => {
	const windowsStore = useWindowsStore();

	const renderTabs: TabListRenderProps = renderProps => {
		const { activeTabIndex, ...tabProps } = renderProps;

		return windowsStore.workspaces.map((workspace, index) => {
			return (
				<Observer key={`events-tab-${index}`}>
					{() => (
						<EventsWindowTab
							store={workspace.eventsStore}
							dragItemPayload={{
								type: TabTypes.Events,
								store: workspace.eventsStore,
								isSelected: activeTabIndex === index,
							}}
							tabIndex={index}
							isSelected={activeTabIndex === index}
							isClosable={windowsStore.workspaces.length > 1}
							isDuplicable={!windowsStore.isFull}
							windowIndex={0}
							onTabDrop={windowsStore.moveTab}
							tabCount={windowsStore.workspaces.length}
							{...tabProps}
						/>
					)}
				</Observer>
			);
		});
	};

	return (
		<Tabs
			activeIndex={windowsStore.tabsStore.activeTabIndex}
			onChange={windowsStore.tabsStore.setActiveWorkspace}
			closeTab={windowsStore.tabsStore.closeWorkspace}
			duplicateTab={windowsStore.tabsStore.duplicateWorkspace}
			tabList={tabListInjectedProps => (
				<DroppableTabList className=''>{renderTabs(tabListInjectedProps)}</DroppableTabList>
			)}
			tabPanels={windowsStore.workspaces.map((workspace, index) => (
				<WorkspaceContextProvider value={workspace} key={index}>
					<Workspace />
				</WorkspaceContextProvider>
			))}
		/>
	);
};

export default observer(WorkspacesLayout);
