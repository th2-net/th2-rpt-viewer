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
import { useOutsideClickListener, useWorkspaces } from '../../hooks';
import Tabs, { TabListRenderProps } from '../tabs/Tabs';
import { createStyleSelector } from '../../helpers/styleCreators';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import SearchWorkspaceStore from '../../stores/workspace/SearchWorkspaceStore';
import { isSearchWorkspaceStore, isWorkspaceStore } from '../../helpers/workspace';
import { SearchWorkspaceContextProvider } from '../../contexts/searchWorkspaceContext';
import '../../styles/root.scss';
import JSONViewerWorkspaceStore from '../../stores/workspace/JSONViewerWorkspaceStore';
import { JSONViewWorspaceContextProvider } from '../../contexts/JSONViewWorspaceContextProvider';
import JSONViewerWorkspace from './JSONViewerWorkspace';
import { ToolsPopup } from '../JSONViewer/LeafTools';

const WorkspacesLayout = () => {
	const workspacesStore = useWorkspaces();
	const createMenuRef = React.useRef<HTMLDivElement>(null);
	const [isCreateMenuOpen, setIsCreateMenuOpen] = React.useState(false);

	const renderTabs: TabListRenderProps = ({ activeTabIndex, setActiveTab }) => {
		const getTabLayout = (
			workspace: WorkspaceStore | SearchWorkspaceStore | JSONViewerWorkspaceStore,
			index: number,
		) => (
			<Observer key={workspace.id}>
				{() => (
					<div
						className={`workspace-tab ${activeTabIndex === index ? 'active' : ''}`}
						onClick={() => setActiveTab(index)}>
						{workspacesStore.workspaces.length > 0 && !isSearchWorkspaceStore(workspace) && (
							<span
								className={createStyleSelector(
									'workspace-tab__close',
									activeTabIndex === index ? 'selected' : null,
								)}
								onClick={e => {
									e.stopPropagation();
									workspacesStore.closeWorkspace(workspace);
								}}
							/>
						)}
						<h3 className='workspace-tab__title'>
							{isWorkspaceStore(workspace)
								? `Workspace ${index}`
								: isSearchWorkspaceStore(workspace)
								? 'Search'
								: `JSONL Reader ${index}`}
						</h3>
					</div>
				)}
			</Observer>
		);

		return [
			getTabLayout(workspacesStore.searchWorkspace, 0),
			...workspacesStore.workspaces.map((workspace, index) => getTabLayout(workspace, index + 1)),
		];
	};

	useOutsideClickListener(
		createMenuRef,
		(e: MouseEvent) => {
			if (
				e.target instanceof Element &&
				createMenuRef.current &&
				!createMenuRef.current.contains(e.target)
			) {
				setIsCreateMenuOpen(false);
			}
		},
		isCreateMenuOpen,
	);

	const addTools = () => (
		<div className='message-card-tools' ref={createMenuRef}>
			<div
				className='workspace-tab workspace-tab__add'
				onClick={e => {
					e.stopPropagation();
					setIsCreateMenuOpen(isOpen => !isOpen);
				}}>
				+
			</div>
			<ToolsPopup isOpen={isCreateMenuOpen} isLeft={true}>
				<div className='message-card-tools__controls-group'>
					<div
						title={'Add event workspace'}
						className='message-card-tools__item'
						onClick={e => {
							e.stopPropagation();
							addWorkspace();
							setIsCreateMenuOpen(false);
						}}>
						<span className='message-card-tools__item-title'>Add event workspace</span>
					</div>
					<div
						title={'Add JSON reader'}
						className='message-card-tools__item'
						onClick={e => {
							e.stopPropagation();
							addJSONWorkspace();
							setIsCreateMenuOpen(false);
						}}>
						<span className='message-card-tools__item-title'>Add JSON reader</span>
					</div>
				</div>
			</ToolsPopup>
		</div>
	);

	function addWorkspace() {
		workspacesStore.createWorkspace().then(workspace => workspacesStore.addWorkspace(workspace));
	}

	function addJSONWorkspace() {
		workspacesStore
			.createJSONWorkspace()
			.then(workspace => workspacesStore.addWorkspace(workspace));
	}

	return (
		<Tabs
			activeIndex={workspacesStore.tabsStore.activeTabIndex}
			onChange={workspacesStore.tabsStore.setActiveWorkspace}
			closeTab={workspacesStore.tabsStore.closeWorkspace}
			tabList={tabListInjectedProps => (
				<>
					{renderTabs(tabListInjectedProps)}
					{addTools()}
				</>
			)}
			tabPanels={[
				<SearchWorkspaceContextProvider
					value={workspacesStore.searchWorkspace}
					key='search-workspace'>
					<SearchWorkspace />
				</SearchWorkspaceContextProvider>,
				...workspacesStore.workspaces.map(workspace => {
					if (isWorkspaceStore(workspace))
						return (
							<WorkspaceContextProvider value={workspace} key={workspace.id}>
								<Workspace />
							</WorkspaceContextProvider>
						);
					return (
						<JSONViewWorspaceContextProvider value={workspace} key={workspace.id}>
							<JSONViewerWorkspace />
						</JSONViewWorspaceContextProvider>
					);
				}),
			]}
		/>
	);
};

export default observer(WorkspacesLayout);
