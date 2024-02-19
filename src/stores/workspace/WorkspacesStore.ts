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
import { nanoid } from 'nanoid';
import ApiSchema from '../../api/ApiSchema';
import { SelectedStore } from '../SelectedStore';
import WorkspaceStore, { WorkspaceUrlState, WorkspaceInitialState } from './WorkspaceStore';
import TabsStore from './TabsStore';
import SearchWorkspaceStore, { SEARCH_STORE_INTERVAL } from './SearchWorkspaceStore';
import { isWorkspaceStore } from '../../helpers/workspace';
import { MessageFilterState } from '../../components/search-panel/SearchPanelFilters';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { getRangeFromTimestamp, getTimestampAsNumber, timestampToNumber } from '../../helpers/date';
import { DbData, IndexedDbStores, Settings } from '../../api/indexedDb';
import RootStore from '../RootStore';
import FiltersHistoryStore from '../FiltersHistoryStore';
import BooksStore from '../BooksStore';
import { GraphItem } from '../../models/Graph';
import { getGraphItemId } from '../../helpers/graph';
import { getScopeFromEventId, isEvent } from '../../helpers/event';
import { isMessage } from '../../helpers/message';
import { Book } from '../../models/Books';
import { Bookmark } from '../../models/Bookmarks';
import { isEventBookmark } from '../../helpers/bookmarks';
import notificationsStore from '../NotificationsStore';
import JSONViewerWorkspaceStore from './JSONViewerWorkspaceStore';

export type WorkspacesUrlState = Array<WorkspaceUrlState>;

export interface AppState {
	workspaces: WorkspacesUrlState;
	bookId?: string;
	eventId?: string;
}
export default class WorkspacesStore {
	public readonly MAX_WORKSPACES_COUNT = 12;

	public selectedStore = new SelectedStore(this, this.api.indexedDb, this.booksStore);

	public tabsStore = new TabsStore(this);

	public searchWorkspace: SearchWorkspaceStore;

	public JSONViewerWorkspace: JSONViewerWorkspaceStore;

	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		public filtersHistoryStore: FiltersHistoryStore,
		private booksStore: BooksStore,
		initialState: AppState | null,
	) {
		this.searchWorkspace = new SearchWorkspaceStore(
			this.rootStore,
			this,
			this.booksStore,
			this.api,
		);

		this.JSONViewerWorkspace = new JSONViewerWorkspaceStore(this, this.api);

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
		return [this.searchWorkspace, this.JSONViewerWorkspace, ...this.workspaces][
			this.tabsStore.activeTabIndex
		];
	}

	@action
	private createEmptyWorkspace = async () => {
		await this.createWorkspace({
			layout: [50, 50],
		}).then(workspace => this.addWorkspace(workspace));
	};

	@action
	private async init(initialState: AppState | null) {
		if (initialState !== null && initialState.bookId) {
			const book = this.booksStore.books.find(b => b.name === initialState.bookId);

			if (!book) {
				const id = nanoid();
				notificationsStore.addMessage({
					id,
					notificationType: 'genericError',
					header: `Unable to find book ${initialState.bookId}`,
					type: 'error',
					description: `Unable to find book ${initialState.bookId} which was in Workspace Link`,
				});
				this.createEmptyWorkspace();
				return;
			}
			this.booksStore.selectBook(book);

			if (initialState.eventId) {
				const scope = getScopeFromEventId(initialState.eventId);

				const event = await this.api.events.getEvent(initialState.eventId);

				const workspaceInitialState = this.getInitialWorkspaceByEvent(
					timestampToNumber(event.startTimestamp),
					scope,
					event,
				);

				this.addWorkspace(await this.createWorkspace(workspaceInitialState));
			} else {
				initialState.workspaces.forEach(async workspaceState =>
					this.addWorkspace(await this.createWorkspace(workspaceState)),
				);
			}
		} else {
			this.createEmptyWorkspace();
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

	public createWorkspace = async (workspaceInitialState: WorkspaceInitialState = {}) => {
		const settings = await this.api.indexedDb.getStoreValues<Settings>(IndexedDbStores.SETTINGS);

		const interval = settings.length > 0 ? settings[0].interval : 15;

		return new WorkspaceStore(
			this,
			this.selectedStore,
			this.searchWorkspace.searchStore,
			this.rootStore.sessionsStore,
			this.rootStore.messageDisplayRulesStore,
			this.booksStore,
			this.api,
			workspaceInitialState,
			interval,
		);
	};

	public getInitialWorkspaceByMessage = (
		timestamp: number,
		bookId: string,
		targetMessage?: EventMessage,
	): WorkspaceInitialState => {
		const requestInfo = this.searchWorkspace.searchStore.currentSearch?.request;
		const filters: MessageFilterState | null = (requestInfo?.filters as MessageFilterState) || null;

		return {
			messages: {
				sse: filters,
				streams: requestInfo?.state.stream || [],
				timestampFrom: null,
				timestampTo: timestamp,
				targetMessage,
			},
			interval: SEARCH_STORE_INTERVAL,
			layout: [0, 100],
			timeRange: getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL),
		};
	};

	public closeWorkspace = (tab: number | WorkspaceStore) => {
		const closedWorkspace = this.tabsStore.closeWorkspace(tab);

		closedWorkspace.dispose();
	};

	public getInitialWorkspaceByEvent = (
		timestamp: number,
		scope: string,
		targetEvent?: EventTreeNode | EventAction,
	): WorkspaceInitialState => {
		const [timestampFrom, timestampTo] = getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL);

		return {
			events: {
				range: [timestampFrom, timestampTo],
				targetEvent,
				scope,
			},
			layout: [100, 0],
			interval: SEARCH_STORE_INTERVAL,
			timeRange: [timestampFrom, timestampTo],
		};
	};

	public onGraphSearchResultSelect = (item: GraphItem) => {
		// s is scope for event and session for message
		const [bookId, scope] = getGraphItemId(item).split(':');
		const book = this.booksStore.books.find(b => b.name === bookId);

		if (!book) return;
		this.booksStore.selectBook(book);

		if (isEvent(item)) {
			if (!isWorkspaceStore(this.activeWorkspace)) {
				const timeRange = getRangeFromTimestamp(getTimestampAsNumber(item), SEARCH_STORE_INTERVAL);
				this.createWorkspace({
					events: {
						targetEvent: item,
						scope,
						range: timeRange,
					},
					timeRange,
				}).then(workspace => this.addWorkspace(workspace));
			} else {
				this.activeWorkspace.eventsStore.goToEvent(item, scope);
			}
		}

		if (isMessage(item)) {
			if (!isWorkspaceStore(this.activeWorkspace)) {
				this.createWorkspace({
					messages: {
						timestampTo: timestampToNumber(item.timestamp),
						targetMessage: item,
						streams: [item.sessionId],
					},
					layout: [50, 50],
				}).then(workspace => this.addWorkspace(workspace));
			} else {
				this.activeWorkspace.messagesStore.onMessageSelect(item);
			}
		}
	};

	public onSelectedBookChange = (book: Book) => {
		this.workspaces.forEach(workspace => {
			workspace.eventsStore.onSelectedBookChange(book);
			workspace.messagesStore.onSelectedBookChange();
		});
	};

	public syncData = async (unsavedData?: DbData) => {
		try {
			await Promise.all([
				this.searchWorkspace.searchStore.syncData(unsavedData),
				this.selectedStore.bookmarksStore.syncData(unsavedData),
			]);
		} catch (error) {
			this.searchWorkspace.searchStore.syncData();
			this.selectedStore.bookmarksStore.syncData();
		}
	};

	public onQuotaExceededError = (unsavedData?: DbData) => {
		this.rootStore.handleQuotaExceededError(unsavedData);
	};

	something = (bookmark: Bookmark) => {
		let initialWorkspaceState: WorkspaceInitialState = {
			interval: SEARCH_STORE_INTERVAL,
		};
		if (isEventBookmark(bookmark)) {
			const timeRange = getRangeFromTimestamp(
				getTimestampAsNumber(bookmark.item),
				SEARCH_STORE_INTERVAL,
			);
			initialWorkspaceState = {
				...initialWorkspaceState,
				timeRange,
				layout: [100, 0],
				events: {
					targetEvent: bookmark.item as EventAction | EventTreeNode,
					range: timeRange,
					scope: bookmark.scope,
				},
			};
		} else {
			const timeRange = getRangeFromTimestamp(
				getTimestampAsNumber(bookmark.item),
				SEARCH_STORE_INTERVAL,
			);
			initialWorkspaceState = {
				...initialWorkspaceState,
				layout: [0, 100],
				timeRange,
				messages: {
					timestampTo: timestampToNumber(bookmark.item.timestamp),
					timestampFrom: null,
					streams: [bookmark.item.sessionId],
					targetMessage: bookmark.item,
				},
			};
		}

		this.createWorkspace(initialWorkspaceState).then(workspace => this.addWorkspace(workspace));
	};
}
