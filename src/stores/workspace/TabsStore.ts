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

import { action, observable, makeObservable } from 'mobx';
import WorkspacesStore from './WorkspacesStore';
import WorkspaceStore from './WorkspaceStore';

export default class TabsStore {
	constructor(private workspacesStore: WorkspacesStore) {
		makeObservable(this, {
			activeTabIndex: observable,
			closeWorkspace: action,
			setActiveWorkspace: action,
			changeWorkspacePosition: action,
		});
	}

	public activeTabIndex = 0;

	public closeWorkspace = (tab: number | WorkspaceStore): void => {
		const index = typeof tab === 'number' ? tab : this.workspacesStore.workspaces.indexOf(tab);
		if (index <= this.activeTabIndex) {
			this.setActiveWorkspace(this.activeTabIndex === 0 ? 0 : this.activeTabIndex - 1);
		}
		const workspaceToClose = this.workspacesStore.workspaces[index];
		workspaceToClose.messagesStore.dispose();
		this.workspacesStore.workspaces.splice(index, 1);
	};

	public setActiveWorkspace = (tabIndex: number): void => {
		this.activeTabIndex = tabIndex;
	};

	public changeWorkspacePosition = (currentTabIndex: number, newIndex: number): void => {
		if (currentTabIndex === newIndex) return;
		const activeTab = this.workspacesStore.workspaces[this.activeTabIndex];
		const insertBeforeTab = this.workspacesStore.workspaces[newIndex];
		const movedTab = this.workspacesStore.workspaces.splice(currentTabIndex, 1)[0];
		if (!insertBeforeTab) {
			this.workspacesStore.workspaces.push(movedTab);
		} else {
			this.workspacesStore.workspaces.splice(
				this.workspacesStore.workspaces.findIndex(t => t === insertBeforeTab),
				0,
				movedTab,
			);
		}
		this.activeTabIndex = this.workspacesStore.workspaces.findIndex(t => t === activeTab);
	};
}
