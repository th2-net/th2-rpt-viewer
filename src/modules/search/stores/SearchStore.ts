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

import moment from 'moment';
import { nanoid } from 'nanoid';
import { action, computed, IReactionDisposer, observable, runInAction } from 'mobx';
import { EventMessage } from 'models/EventMessage';
import { EntityType, EventAction } from 'models/EventAction';
import { MessagesSSEChannel } from 'stores/SSEChannel/MessagesSSEChannel';
import EventSSEChannel from 'stores/SSEChannel/EventsSSEChannel';
import { SearchDirection } from 'models/SearchDirection';
import WorkspacesStore from 'stores/workspace/WorkspacesStore';
import FiltersHistoryStore from 'stores/FiltersHistoryStore';
import { SessionHistoryStore } from 'modules/messages/stores/SessionHistoryStore';
import { IFilterConfigStore, ISearchStore } from 'models/Stores';
import ApiSchema from 'api/ApiSchema';
import { IndexedDbStores } from 'api/indexedDb';
import EventsFilterStore from 'modules/events/stores/EventsFilterStore';
import MessagesFilterStore from 'modules/messages/stores/MessagesFilterStore';
import { TimeRange } from 'models/Timestamp';
import {
	EventSSEParams,
	getEventsSSEParams,
	getMessagesSSEParams,
	MessagesSSEParams,
	SSEHeartbeat,
} from 'api/sse';
import notificationsStore from 'stores/NotificationsStore';
import { isQuotaExceededError } from 'helpers/fetch';
import {
	EventsSearchResult,
	MessagesSearchResult,
	SearchResult,
	EventsSearchHistory,
	MessagesSearchHistory,
} from './SearchResult';

export type SearchResultItem = EventAction | EventMessage;

export type SearchHistory = EventsSearchHistory | MessagesSearchHistory;

const endTimestampDefault = moment.utc().valueOf();
const startTimestampDefault = moment.utc(endTimestampDefault).subtract(30, 'minutes').valueOf();

const defaultRange: TimeRange = [startTimestampDefault, endTimestampDefault];

/* eslint-disable no-param-reassign */
export class SearchStore implements ISearchStore {
	private subscriptions: IReactionDisposer[] = [];

	constructor(
		private workspacesStore: WorkspacesStore,
		private api: ApiSchema,
		private filtersHistory: FiltersHistoryStore,
		private sessionsStore: SessionHistoryStore,
		private filterConfigStore: IFilterConfigStore,
	) {
		this.getSearchHistory();
	}

	eventsFilterStore = new EventsFilterStore(this.filterConfigStore, {
		range: defaultRange,
	});

	messagesFilterStore = new MessagesFilterStore(this.filterConfigStore, {
		startTimestamp: defaultRange[0],
		endTimestamp: defaultRange[1],
	});

	@observable.ref
	eventsLoader: EventSSEChannel | null = null;

	@observable.ref
	messagesLoader: MessagesSSEChannel | null = null;

	@observable
	formType: EntityType = 'event';

	@observable.ref
	currentSearch: EventsSearchResult | MessagesSearchResult | null = null;

	@action
	public setFormType = (formType: EntityType) => {
		if (formType === this.formType) {
			return;
		}
		const stores = [this.eventsFilterStore, this.messagesFilterStore];
		if (formType === 'event') {
			stores.reverse();
		}
		stores[1].setStartTimestamp(stores[0].startTimestamp as number);
		stores[1].setEndTimestamp(stores[0].endTimestamp as number);

		this.formType = formType;
	};

	@computed
	public get isSearching() {
		if (this.formType === 'event') {
			return Boolean(this.eventsLoader?.isLoading);
		}
		return Boolean(this.messagesLoader?.isLoading);
	}

	@action
	public startSearch = () => {
		if (this.formType === 'message') {
			let searchResult = SearchResult.fromFilterStore(
				this.messagesFilterStore,
			) as MessagesSearchResult | null;

			if (searchResult) {
				searchResult = observable(searchResult);
				this.currentSearch = searchResult;

				const { endTimestamp, startTimestamp, streams, filter } = searchResult;
				const params = getMessagesSSEParams({
					filter,
					params: {
						endTimestamp,
						startTimestamp,
						streams,
					},
					searchDirection: SearchDirection.Next,
				});
				this.startMessagesSearch(params, searchResult);
				this.sessionsStore.saveSessions(streams);
				this.filtersHistory.onMessageFilterSubmit(filter);
			}
		} else {
			let searchResult = SearchResult.fromFilterStore(
				this.eventsFilterStore,
			) as EventsSearchResult | null;

			if (searchResult) {
				searchResult = observable(searchResult);
				this.currentSearch = searchResult;
				const { endTimestamp, startTimestamp, filter } = searchResult;
				const params = getEventsSSEParams({
					endTimestamp,
					filter,
					searchDirection: SearchDirection.Next,
					startTimestamp,
					metadataOnly: false,
				});
				this.startEventsSearch(params, searchResult);
				this.filtersHistory.onEventFilterSubmit(filter);
			}
		}
	};

	@action
	public stopSearch = () => {
		this.messagesLoader?.stop();
		this.eventsLoader?.stop();
	};

	@action
	private startMessagesSearch = (params: MessagesSSEParams, searchResult: MessagesSearchResult) => {
		this.messagesLoader = new MessagesSSEChannel(params, {
			onError: this.onError,
			onResponse: messages => this.onMessagesResponse(messages, searchResult),
			onClose: messages => {
				this.onMessagesResponse(messages, searchResult);
				searchResult.onSearchEnd();
				this.saveSearchResult(searchResult.toJs());
			},
			onKeepAliveResponse: heartbeat => this.onKeepAlive(heartbeat, searchResult),
		});

		this.messagesLoader.subscribe();
	};

	@action
	private onMessagesResponse = (messages: EventMessage[], searchResult: MessagesSearchResult) => {
		searchResult.addData(messages);
	};

	@action
	private startEventsSearch = (params: EventSSEParams, searchResult: EventsSearchResult) => {
		this.eventsLoader = new EventSSEChannel(params, {
			onError: this.onError,
			// TODO: fix generic events type
			onResponse: events => this.onEventsResponse(events as unknown as EventAction[], searchResult),
			onClose: events => {
				this.onEventsResponse(events as unknown as EventAction[], searchResult);
				searchResult.onSearchEnd();
				this.saveSearchResult(searchResult.toJs());
			},
			onKeepAlive: heartbeat => this.onKeepAlive(heartbeat, searchResult),
		});

		this.eventsLoader.subscribe();
	};

	@action
	public filterEventsByParent = (parentId: string, parentTimestamp: number) => {
		const filter = this.eventsFilterStore.filter;
		if (filter) {
			this.stopSearch();
			this.formType = 'event';
			this.eventsFilterStore.setRange([
				parentTimestamp,
				parentTimestamp + this.eventsFilterStore.interval * 60 * 1000,
			]);
			this.eventsFilterStore.setEventsFilter({
				...filter,
				parentId: {
					...filter.parentId,
					values: [parentId],
				},
			});
			this.workspacesStore.tabsStore.setActiveWorkspace(0);
		}
	};

	@action
	private onEventsResponse = (events: EventAction[], searchResult: EventsSearchResult) => {
		searchResult.addData(events);
	};

	@action
	private onKeepAlive = (
		heartbeat: SSEHeartbeat,
		searchResult: MessagesSearchResult | EventsSearchResult,
	) => {
		searchResult.processedObjectsCount = heartbeat.scanCounter;
		searchResult.currentTimestamp = heartbeat.timestamp;
	};

	private onError = (ev: Event) => {
		if (ev instanceof MessageEvent) {
			notificationsStore.handleSSEError(ev);
		} else {
			const evSource = ev.currentTarget as EventSource;
			const errorId = nanoid();
			notificationsStore.addMessage({
				id: errorId,
				notificationType: 'genericError',
				header: `EventSource error - check the console.`,
				type: 'error',
				description: evSource ? `${ev.type} at ${evSource.url}` : `${ev.type}`,
			});
		}
	};

	private getSearchHistory = async () => {
		try {
			const searchHistory = await this.api.indexedDb.getStoreValues<SearchHistory>(
				IndexedDbStores.SEARCH_HISTORY,
			);
			const lastSearchItem = searchHistory[searchHistory.length - 1];
			if (lastSearchItem) {
				runInAction(() => {
					if (lastSearchItem.type === 'event') {
						const state = lastSearchItem as EventsSearchHistory;
						const eventSearchResult = new EventsSearchResult(state);
						this.formType = 'event';
						this.eventsFilterStore.setEventsFilter(state.filter);
						this.eventsFilterStore.setStartTimestamp(state.startTimestamp);
						this.eventsFilterStore.setEndTimestamp(state.endTimestamp);

						this.currentSearch = eventSearchResult;
					} else {
						const state = lastSearchItem as MessagesSearchHistory;
						const { filter, startTimestamp, endTimestamp, streams } = state;
						const messageSearchResult = new MessagesSearchResult(state);

						this.formType = 'message';
						this.messagesFilterStore.setMessagesFilter(
							{ endTimestamp, startTimestamp, streams },
							filter,
						);
						this.messagesFilterStore.setStartTimestamp(state.startTimestamp);
						this.messagesFilterStore.setEndTimestamp(state.endTimestamp);

						this.currentSearch = messageSearchResult;
					}
				});
			}
		} catch (error) {
			console.error('Failed to load search history', error);
		}
	};

	private saveSearchResult = async (search: SearchHistory) => {
		try {
			const savedSearchResultKeys = await this.api.indexedDb.getStoreKeys<number>(
				IndexedDbStores.SEARCH_HISTORY,
			);
			await Promise.all([
				savedSearchResultKeys.map(key =>
					this.api.indexedDb.deleteDbStoreItem(IndexedDbStores.SESSIONS_HISTORY, key),
				),
			]);

			await this.api.indexedDb.addDbStoreItem(IndexedDbStores.SEARCH_HISTORY, search);
		} catch (error) {
			if (isQuotaExceededError(error)) {
				this.workspacesStore.onQuotaExceededError(search);
			} else {
				notificationsStore.addMessage({
					notificationType: 'genericError',
					type: 'error',
					header: `Failed to save current search result`,
					description: error instanceof Error ? error.message : `${error}`,
					id: nanoid(),
				});
			}
		}
	};

	public dispose = () => {
		this.subscriptions.forEach(unsubscribe => unsubscribe());
	};
}
