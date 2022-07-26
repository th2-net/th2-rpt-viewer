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

import { observable, action, computed } from 'mobx';
import { BookmarksStore } from 'modules/bookmarks/stores/BookmarksStore';
import { IBookmarksStore, IFilterConfigStore } from 'models/Stores';
import ApiSchema from 'api/ApiSchema';
import { DbData } from 'api/indexedDb';
import { SearchStore } from 'modules/search/stores/SearchStore';
import { MessageFilterState } from 'modules/search/models/Search';
import { SessionHistoryStore } from 'stores/messages/SessionHistoryStore';
import MessageDisplayRulesStore from 'stores/MessageDisplayRulesStore';
import { getRangeFromTimestamp } from '../../helpers/date';
import WorkspaceStore, { WorkspaceUrlState, WorkspaceInitialState } from './WorkspaceStore';
import TabsStore from './TabsStore';
import RootStore from '../RootStore';
import FiltersHistoryStore from '../FiltersHistoryStore';
import { EventMessage } from '../../models/EventMessage';
import { EventTreeNode, EventAction } from '../../models/EventAction';

const SEARCH_INTERVAL = 15;

export type WorkspacesUrlState = Array<WorkspaceUrlState>;

export default class WorkspacesStore {
	public readonly MAX_WORKSPACES_COUNT = 10;

	public bookmarksStore: IBookmarksStore;

	public searchStore: SearchStore;

	public tabsStore = new TabsStore(this);

	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		private filterConfigStore: IFilterConfigStore,
		private messageDisplayRulesStore: MessageDisplayRulesStore,
		public filtersHistoryStore: FiltersHistoryStore,
		private sessionsStore: SessionHistoryStore,
		initialState: WorkspacesUrlState | null,
	) {
		this.init(initialState || null);

		this.searchStore = new SearchStore(
			this,
			api,
			filtersHistoryStore,
			sessionsStore,
			filterConfigStore,
		);

		this.bookmarksStore = new BookmarksStore(this, this.api.indexedDb);
	}

	@observable workspaces: Array<WorkspaceStore> = [];

	@computed get isFull() {
		return this.workspaces.length === this.MAX_WORKSPACES_COUNT;
	}

	@computed get activeWorkspace() {
		return this.workspaces[this.tabsStore.activeTabIndex];
	}

	@action
	public deleteWorkspace = (workspace: WorkspaceStore) => {
		this.workspaces.splice(this.workspaces.indexOf(workspace), 1);
	};

	@action
	public addWorkspace = (workspace = this.createWorkspace()) => {
		if (this.isFull) return;
		this.workspaces.push(workspace);
		this.tabsStore.setActiveWorkspace(this.workspaces.length - 1);
	};

	public getInitialWorkspaceByMessage = (
		timestamp: number,
		targetMessage?: EventMessage,
	): WorkspaceInitialState => {
		const requestInfo = this.searchStore.currentSearch?.request;
		const filters: MessageFilterState | null = (requestInfo?.filters as MessageFilterState) || null;

		return {
			messages: {
				sse: filters,
				streams: requestInfo?.state.stream || [],
				timestampFrom: null,
				timestampTo: timestamp,
				targetMessage,
			},
			interval: SEARCH_INTERVAL,
			layout: [0, 0, 100, 0],
			timeRange: getRangeFromTimestamp(timestamp, SEARCH_INTERVAL),
		};
	};

	public getInitialWorkspaceByEvent = (
		timestamp: number,
		targetEvent?: EventTreeNode | EventAction,
	): WorkspaceInitialState => {
		const [timestampFrom, timestampTo] = getRangeFromTimestamp(timestamp, SEARCH_INTERVAL);

		return {
			events: {
				range: [timestampFrom, timestampTo],
				targetEvent,
			},
			layout: [0, 100, 0, 0],
			interval: SEARCH_INTERVAL,
			timeRange: [timestampFrom, timestampTo],
		};
	};

	public createWorkspace = (workspaceInitialState: WorkspaceInitialState = {}) =>
		new WorkspaceStore(
			this,
			this.rootStore.sessionsStore,
			this.filterConfigStore,
			this.messageDisplayRulesStore,
			this.api,
			workspaceInitialState,
		);

	public closeWorkspace = (tab: number | WorkspaceStore) => {
		const closedWorkspace = this.tabsStore.closeWorkspace(tab);

		closedWorkspace.dispose();
	};

	public syncData = async (unsavedData?: DbData) => {
		console.log({ unsavedData });
		// TODO: Fix sync data
		// try {
		// 	await Promise.all([
		// 		this.searchWorkspace.searchStore.syncData(unsavedData),
		// 		this.selectedStore.bookmarksStore.syncData(unsavedData),
		// 	]);
		// } catch (error) {
		// 	this.searchWorkspace.searchStore.syncData();
		// 	this.selectedStore.bookmarksStore.syncData();
		// }
	};

	public onQuotaExceededError = (unsavedData?: DbData) => {
		this.rootStore.handleQuotaExceededError(unsavedData);
	};

	private init(initialState: WorkspacesUrlState | null) {
		if (initialState !== null) {
			initialState.forEach(workspaceState =>
				this.addWorkspace(this.createWorkspace(workspaceState)),
			);
		} else {
			this.addWorkspace(
				this.createWorkspace({
					layout: [0, 100, 0, 0],
				}),
			);
		}
	}
}
