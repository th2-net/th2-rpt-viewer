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
import WorkspaceStore, {
	WorkspaceUrlState,
	WorkspaceInitialState,
	getRangeFromTimestamp,
} from './WorkspaceStore';
import TabsStore from './TabsStore';
import SearchWorkspaceStore, { SEARCH_STORE_INTERVAL } from './SearchWorkspaceStore';
import { isWorkspaceStore } from '../../helpers/workspace';
import {
	EventFilterState,
	MessageFilterState,
} from '../../components/search-panel/SearchPanelFilters';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';

export type WorkspacesUrlState = Array<WorkspaceUrlState>;
export default class WorkspacesStore {
	public readonly MAX_WORKSPACES_COUNT = 12;

	selectedStore = new SelectedStore(this);

	tabsStore = new TabsStore(this);

	public searchWorkspace: SearchWorkspaceStore;

	constructor(private api: ApiSchema, initialState: WorkspacesUrlState | null) {
		this.searchWorkspace = new SearchWorkspaceStore(this, this.api);

		this.init(initialState || null);

		reaction(
			() => this.activeWorkspace,
			activeWorkspace =>
				isWorkspaceStore(activeWorkspace) && this.onActiveWorkspaceChange(activeWorkspace),
		);
	}

	@observable workspaces: Array<WorkspaceStore> = [];

	@computed get eventStores() {
		return this.workspaces.map(workspace => workspace.eventsStore);
	}

	@computed get isFull() {
		return this.workspaces.length === this.MAX_WORKSPACES_COUNT;
	}

	@computed get activeWorkspace() {
		return [this.searchWorkspace, ...this.workspaces][this.tabsStore.activeTabIndex];
	}

	@action
	private init(initialState: WorkspacesUrlState | null) {
		if (initialState !== null) {
			initialState.forEach(workspaceState =>
				this.addWorkspace(this.createWorkspace(workspaceState)),
			);
		}
	}

	@action
	public deleteWorkspace = (workspace: WorkspaceStore) => {
		this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
	};

	@action
	public addWorkspace = (workspace: WorkspaceStore) => {
		this.workspaces.push(workspace);
		this.tabsStore.setActiveWorkspace(this.workspaces.length);
	};

	private onActiveWorkspaceChange = (activeWorkspace: WorkspaceStore) => {
		activeWorkspace.graphStore.setTimestampFromRange(activeWorkspace.graphStore.range);
	};

	public createWorkspace = (workspaceInitialState: WorkspaceInitialState = {}) => {
		return new WorkspaceStore(
			this,
			this.selectedStore,
			this.searchWorkspace.searchStore,
			this.api,
			workspaceInitialState,
		);
	};

	public getInitialWorkspaceByMessage = (
		timestamp: number,
		isSoftFilter = false,
		targetMessage?: EventMessage,
	): WorkspaceInitialState => {
		const requestInfo = this.searchWorkspace.searchStore.currentSearch?.request;
		return {
			messages: {
				sse: (requestInfo?.filters as MessageFilterState) || null,
				streams: requestInfo?.state.stream || [],
				timestampFrom: null,
				timestampTo: timestamp,
				targetMessage,
				isSoftFilter,
			},
			interval: SEARCH_STORE_INTERVAL,
			layout: [0, 100],
			timeRange: getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL),
		};
	};

	public getInitialWorkspaceByEvent = (
		timestamp: number,
		targetEvent?: EventTreeNode | EventAction,
	): WorkspaceInitialState => {
		const requestInfo = this.searchWorkspace.searchStore.currentSearch?.request;
		const filter = requestInfo?.filters as EventFilterState | undefined;
		const [timestampFrom, timestampTo] = getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL);
		return {
			events: {
				filter: {
					eventTypes: filter && !filter.type.negative ? filter.type.values : [],
					names: filter && !filter.name.negative ? filter.name.values : [],
					timestampFrom,
					timestampTo,
				},
				targetEvent,
			},
			layout: [100, 0],
			interval: SEARCH_STORE_INTERVAL,
			timeRange: [timestampFrom, timestampTo],
		};
	};
}
