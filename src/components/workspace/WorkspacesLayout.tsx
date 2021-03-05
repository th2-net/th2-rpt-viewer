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
import SearchWorkspace from './SearchWorkspace';
import { WorkspaceContextProvider } from '../../contexts/workspaceContext';
import { useWorkspaces } from '../../hooks';
import Tabs, { TabListRenderProps } from '../tabs/Tabs';
import { createStyleSelector } from '../../helpers/styleCreators';
import '../../styles/root.scss';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';

const WorkspacesLayout = () => {
	const workspacesStore = useWorkspaces();

	const renderTabs: TabListRenderProps = ({ activeTabIndex, setActiveTab }) => {
		const getTabLayout = (workspace: WorkspaceStore, index: number, isSearchStore: boolean) => (
			<Observer key={workspace.id}>
				{() => (
					<div
						className={`workspace-tab ${activeTabIndex === index ? 'active' : ''}`}
						onClick={() => setActiveTab(index)}>
						{!isSearchStore && (
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
						<h3 className='workspace-tab__title'>
							{!isSearchStore ? `Workspace ${index}` : 'Search'}
						</h3>
					</div>
				)}
			</Observer>
		);

		return [
			getTabLayout(workspacesStore.searchWorkspace, 0, true),
			...workspacesStore.workspaces.map((workspace, index) =>
				getTabLayout(workspace, index + 1, false),
			),
		];
	};

	function addWorkspace() {
		workspacesStore.addWorkspace(workspacesStore.createWorkspace());
	}

	return (
		<Tabs
			activeIndex={workspacesStore.tabsStore.activeTabIndex}
			onChange={workspacesStore.tabsStore.setActiveWorkspace}
			closeTab={workspacesStore.tabsStore.closeWorkspace}
			tabList={tabListInjectedProps => (
				<>
					{renderTabs(tabListInjectedProps)}
					<div className='workspace-tab workspace-tab__add' onClick={addWorkspace}>
						+
					</div>
				</>
			)}
			tabPanels={[
				<WorkspaceContextProvider value={workspacesStore.searchWorkspace} key='search-workspace'>
					<SearchWorkspace />
				</WorkspaceContextProvider>,
				...workspacesStore.workspaces.map(workspace => (
					<WorkspaceContextProvider value={workspace} key={workspace.id}>
						<Workspace />
					</WorkspaceContextProvider>
				)),
			]}
		/>
	);
};

export default observer(WorkspacesLayout);
