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
import { WorkspaceContextProvider } from '../../contexts/workspaceContext';
import { useWorkspaces } from '../../hooks';
import Tabs, { TabListRenderProps } from '../tabs/Tabs';
import DroppableTabList from '../tabs/DroppableTabList';
import { createStyleSelector } from '../../helpers/styleCreators';
import '../../styles/root.scss';

const WorkspacesLayout = () => {
	const workspacesStore = useWorkspaces();

	const renderTabs: TabListRenderProps = ({ activeTabIndex, setActiveTab }) => {
		return workspacesStore.workspaces.map((workspace, index) => {
			return (
				<Observer key={`events-tab-${index}`}>
					{() => (
						<div
							className={`workspace-tab ${activeTabIndex === index ? 'active' : ''}`}
							onClick={() => setActiveTab(index)}>
							{workspacesStore.workspaces.length > 1 && (
								<span
									className={createStyleSelector(
										'workspace-tab__close',
										activeTabIndex === index ? 'selected' : null,
									)}
									onClick={e => {
										e.stopPropagation();
										workspacesStore.tabsStore.closeWorkspace(workspace);
									}}
								/>
							)}
							<h3 className='workspace-tab__title'>Workspace {index + 1}</h3>
						</div>
					)}
				</Observer>
			);
		});
	};

	return (
		<Tabs
			activeIndex={workspacesStore.tabsStore.activeTabIndex}
			onChange={workspacesStore.tabsStore.setActiveWorkspace}
			closeTab={workspacesStore.tabsStore.closeWorkspace}
			duplicateTab={workspacesStore.tabsStore.duplicateWorkspace}
			tabList={tabListInjectedProps => (
				<DroppableTabList>
					{renderTabs(tabListInjectedProps)}
					<div
						className='workspace-tab workspace-tab__add'
						onClick={() => workspacesStore.addWorkspace(workspacesStore.createWorkspace())}>
						+
					</div>
				</DroppableTabList>
			)}
			tabPanels={workspacesStore.workspaces.map((workspace, index) => (
				<WorkspaceContextProvider value={workspace} key={index}>
					<Workspace isActive={workspacesStore.activeWorkspace === workspace} />
				</WorkspaceContextProvider>
			))}
		/>
	);
};

export default observer(WorkspacesLayout);
