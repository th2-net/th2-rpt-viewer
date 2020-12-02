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

import { action, observable } from 'mobx';
import WorkspacesStore from './WorkspacesStore';

export default class TabsStore {
	constructor(private workspacesStore: WorkspacesStore) {}

	@observable activeTabIndex = 0;

	@action
	duplicateWorkspace = (tabIndex: number) => {
		const worspaceToDublicate = this.workspacesStore.workspaces[tabIndex];
		const workspaceCopy = this.workspacesStore.createWorkspace(
			worspaceToDublicate.eventsStore,
			worspaceToDublicate.messagesStore,
		);
		this.workspacesStore.addWorkspace(workspaceCopy);
		this.activeTabIndex = this.workspacesStore.workspaces.length - 1;
	};

	@action
	closeWorkspace = (tabIndex: number) => {
		if (tabIndex <= this.activeTabIndex) {
			this.activeTabIndex = this.activeTabIndex === 0 ? 0 : this.activeTabIndex - 1;
		}
		const workspaceToClose = this.workspacesStore.workspaces[tabIndex];
		workspaceToClose.messagesStore.dispose();
		this.workspacesStore.deleteWorkspace(workspaceToClose);
	};

	@action
	setActiveWorkspace = (tabIndex: number) => {
		this.activeTabIndex = tabIndex;
	};

	@action
	changeWorkspacePosition = (currentTabIndex: number, newIndex: number) => {
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
