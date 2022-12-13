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
import { DbData, IndexedDbStores, SavedWorkspaceState } from 'api/indexedDb';
import { MessagesSearchResult } from 'modules/search/stores/SearchResult';
import { SessionHistoryStore } from 'modules/messages/stores/SessionHistoryStore';
import { getRangeFromTimestamp } from '../../helpers/date';
import WorkspaceStore, { WorkspaceUrlState, WorkspaceInitialState } from './WorkspaceStore';
import TabsStore from './TabsStore';
import RootStore from '../RootStore';
import FiltersHistoryStore from '../FiltersHistoryStore';
import { EventMessage } from '../../models/EventMessage';
import { EventTreeNode, EventAction } from '../../models/EventAction';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';

const SEARCH_INTERVAL = 15;

export type WorkspacesUrlState = Array<WorkspaceUrlState>;

export default class WorkspacesStore {
	public readonly MAX_WORKSPACES_COUNT = 10;

	public bookmarksStore: IBookmarksStore;

	public tabsStore = new TabsStore(this);

	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		private filterConfigStore: IFilterConfigStore,
		public filtersHistoryStore: FiltersHistoryStore,
		private sessionsStore: SessionHistoryStore,
		initialState: WorkspacesUrlState | null,
	) {
		this.bookmarksStore = new BookmarksStore(this, this.api.indexedDb);

		this.init(initialState || null);
	}

	@observable workspaces: Array<WorkspaceStore> = [];

	@computed get isFull() {
		return this.workspaces.length === this.MAX_WORKSPACES_COUNT;
	}

	@computed get activeWorkspace() {
		return this.workspaces[this.tabsStore.activeTabIndex];
	}

	@action
	private async init(initialState: WorkspacesUrlState | null) {
		if (initialState !== null) {
			initialState.forEach(async workspaceState =>
				this.addWorkspace(await this.createWorkspace(workspaceState)),
			);
		} else {
			const workspaces = await this.getWorkspaces();
			workspaces.forEach(workspaceState =>
				this.createWorkspace(workspaceState).then(this.addWorkspace),
			);
		}

		const savedWorkspaces = await this.api.indexedDb.getStoreKeys<string>(
			IndexedDbStores.WORKSPACES_STATE,
		);

		savedWorkspaces
			.filter(workspaceId => !this.workspaces.find(workspace => workspace.id === workspaceId))
			.forEach(this.removeSavedWorkspaceState);
	}

	private removeSavedWorkspaceState = (workspaceId: string) => {
		this.api.indexedDb.deleteDbStoreItem(IndexedDbStores.WORKSPACES_STATE, workspaceId);
		this.api.indexedDb.deleteDbStoreItem(IndexedDbStores.SEARCH_HISTORY, workspaceId);
	};

	@action
	public addWorkspace = async (workspace?: WorkspaceStore) => {
		if (this.isFull) return;
		if (!workspace) {
			// eslint-disable-next-line no-param-reassign
			workspace = await this.createWorkspace();
		}
		this.workspaces.push(workspace);
		this.tabsStore.setActiveWorkspace(this.workspaces.length - 1);
	};

	public createWorkspace = async (workspaceInitialState: WorkspaceInitialState = {}) =>
		new WorkspaceStore(
			this,
			this.rootStore.sessionsStore,
			this.filterConfigStore,
			this.bookmarksStore,
			this.api,
			workspaceInitialState,
		);

	public getInitialWorkspaceByMessage = (
		currentSearch: MessagesSearchResult,
		timestamp: number,
		targetMessage?: EventMessage,
	): WorkspaceInitialState => {
		const filter = currentSearch?.filter;

		return {
			messages: {
				sse: filter,
				streams: currentSearch?.streams || [],
				startTimestamp: timestamp,
				endTimestamp: null,
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

	public closeWorkspace = (tab: number | WorkspaceStore) => {
		const closedWorkspace = this.tabsStore.closeWorkspace(tab);

		closedWorkspace.dispose();
		this.removeSavedWorkspaceState(closedWorkspace.id);
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

	private getWorkspaces = async (): Promise<WorkspaceInitialState[]> => {
		const defaultWorkspace = [
			{
				layout: [0, 100, 0, 0] as WorkspacePanelsLayout,
			},
		];

		const savedWorkspaces = await this.api.indexedDb.getStoreValues<SavedWorkspaceState>(
			IndexedDbStores.WORKSPACES_STATE,
		);

		if (savedWorkspaces && savedWorkspaces.length > 0) {
			return savedWorkspaces;
		}

		return defaultWorkspace;
	};
}
