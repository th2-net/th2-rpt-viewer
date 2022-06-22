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

import { Observer, observer } from 'mobx-react-lite';
import Workspace from './Workspace';
import { WorkspaceContextProvider } from '../../contexts/workspaceContext';
import { useWorkspaces } from '../../hooks';
import Tabs, { TabListRenderProps } from '../tabs/Tabs';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import '../../styles/root.scss';
import { copyTextToClipboard } from '../../helpers/copyHandler';

const WorkspacesLayout = () => {
	const workspacesStore = useWorkspaces();

	const renderTabs: TabListRenderProps = ({ activeTabIndex, setActiveTab }) => {
		const getTabLayout = (workspace: WorkspaceStore, index: number) => {
			const isTabSelected = activeTabIndex === index;
			const controlButtonClassName = createBemElement(
				'workspace-tab',
				'control-button',
				isTabSelected ? 'selected' : null,
			);
			const copyButtonClassName = createBemElement(
				'workspace-tab',
				'copy',
				isTabSelected ? 'selected' : null,
			);

			return (
				<Observer key={workspace.id}>
					{() => (
						<div
							className={`workspace-tab ${activeTabIndex === index ? 'active' : ''}`}
							onClick={() => setActiveTab(index)}>
							<h3 className='workspace-tab__title'>Workspace {index + 1}</h3>
							<div className='workspace-tab__controls'>
								<div
									className={controlButtonClassName}
									title='Copy workspace link'
									onClick={e => {
										e.stopPropagation();
										const appState = workspace.getWorkspaceState();
										const searchString = appState
											? new URLSearchParams({ workspaces: window.btoa(JSON.stringify(appState)) })
											: null;
										copyTextToClipboard(
											[window.location.origin, window.location.pathname, `?${searchString}`].join(
												'',
											),
										);
									}}>
									<div className={copyButtonClassName} />
								</div>
								{workspacesStore.workspaces.length > 1 && (
									<div
										className={controlButtonClassName}
										onClick={e => {
											e.stopPropagation();
											workspacesStore.closeWorkspace(workspace);
										}}>
										<div
											className={createStyleSelector(
												'workspace-tab__close',
												activeTabIndex === index ? 'selected' : null,
											)}
										/>
									</div>
								)}
							</div>
						</div>
					)}
				</Observer>
			);
		};

		return [
			...workspacesStore.workspaces.map((workspace, index) => getTabLayout(workspace, index)),
		];
	};

	function addWorkspace() {
		workspacesStore.addWorkspace();
	}

	return (
		<Tabs
			activeIndex={workspacesStore.tabsStore.activeTabIndex}
			onChange={workspacesStore.tabsStore.setActiveWorkspace}
			closeTab={workspacesStore.tabsStore.closeWorkspace}
			tabList={tabListInjectedProps => (
				<>
					{renderTabs(tabListInjectedProps)}
					{!workspacesStore.isFull && (
						<button className='workspace-tab workspace-tab__add' onClick={addWorkspace}>
							+
						</button>
					)}
				</>
			)}
			tabPanels={workspacesStore.workspaces.map(workspace => (
				<WorkspaceContextProvider value={workspace} key={workspace.id}>
					<Workspace />
				</WorkspaceContextProvider>
			))}
		/>
	);
};

export default observer(WorkspacesLayout);
