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

import { observable, action, computed, reaction } from 'mobx';
import ApiSchema from '../../api/ApiSchema';
import { SelectedStore } from '../SelectedStore';
import WorkspaceStore, { WorkspaceUrlState, WorkspaceInitialState } from './WorkspaceStore';
import TabsStore from './TabsStore';

export type WorkspacesUrlState = Array<WorkspaceUrlState>;
export default class WorkspacesStore {
	public readonly MAX_WORKSPACES_COUNT = 12;

	selectedStore = new SelectedStore(this);

	tabsStore: TabsStore;

	constructor(private api: ApiSchema, initialState: WorkspacesUrlState | null) {
		this.init(initialState);

		this.tabsStore = new TabsStore(this);
	}

	@observable workspaces: Array<WorkspaceStore> = [];

	@computed get eventStores() {
		return this.workspaces.map(workspace => workspace.eventsStore);
	}

	@computed get isFull() {
		return this.workspaces.length === this.MAX_WORKSPACES_COUNT;
	}

	@computed get activeWorkspace() {
		return this.workspaces[this.tabsStore.activeTabIndex];
	}

	@action
	private init(initialState: WorkspacesUrlState | null) {
		if (!initialState) {
			this.addWorkspace(this.createWorkspace());
			return;
		}

		try {
			initialState.map(workspaceState => this.addWorkspace(this.createWorkspace(workspaceState)));
		} catch (error) {
			this.addWorkspace(this.createWorkspace());
		}
	}

	@action
	public deleteWorkspace = (workspace: WorkspaceStore) => {
		this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
	};

	@action
	public addWorkspace = (workspace: WorkspaceStore) => {
		this.workspaces.push(workspace);
	};

	public createWorkspace = (workspaceInitialState: WorkspaceInitialState = {}) => {
		return new WorkspaceStore(this, this.selectedStore, this.api, workspaceInitialState);
	};
}
