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

import { action, autorun, computed, observable, reaction, runInAction, toJS } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import ApiSchema from '../api/ApiSchema';
import {
	EventsFiltersInfo,
	MessageIdsEvent,
	MessagesFilterInfo,
	SSEFilterInfo,
	SSEHeartbeat,
	SSEParams,
} from '../api/sse';
import { DbData, indexedDbLimits, IndexedDbStores } from '../api/indexedDb';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { getTimestampAsNumber } from '../helpers/date';
import { getItemId, isEventMessage, isEventNode } from '../helpers/event';
import {
	getDefaultEventsFiltersState,
	getDefaultMessagesFiltersState,
	getResultGroupKey,
	isSearchHistoryEntity,
} from '../helpers/search';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { SearchDirection } from '../models/search/SearchDirection';
import notificationsStore from './NotificationsStore';
import WorkspacesStore from './workspace/WorkspacesStore';
import FiltersHistoryStore from './FiltersHistoryStore';
import { SessionsStore } from './messages/SessionsStore';
import { getArrayOfUniques, getItemAt } from '../helpers/array';
import BooksStore from './BooksStore';

type SSESearchDirection = SearchDirection.Next | SearchDirection.Previous;

export type SearchPanelFormState = {
	startTimestamp: number | null;
	timeLimits: {
		previous: number | null;
		next: number | null;
	};
	resultCountLimit: number;
	searchDirection: SearchDirection | null;
	stream: string[];
	scope: string;
};

export type SearchResult = EventTreeNode | EventMessage;

export type SearchHistory = {
	timestamp: number;
	bookId: string;
	results: Record<string, Array<SearchResult>>;
	request: StateHistory;
	progress: {
		previous: number;
		next: number;
	};
	processedObjectCount: {
		previous: number;
		next: number;
	};
};

export type StateHistory = {
	type: SearchPanelType;
	state: SearchPanelFormState;
	filters: EventFilterState | MessageFilterState;
	scope: string;
};

export type SearchHistoryState<T> = {
	index: number;
	limit: number;
	disableForward: boolean;
	disableBackward: boolean;
	currentSearch: null | T;
	history: Array<T>;
};

type SearchProgressState = {
	completed: boolean;
	lastEventId: string | null;
	lastProcessedObjectCount: number;
	resultCount: number;
};

const SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES = 1;
const SEARCH_CHUNK_SIZE = 500;

function getDefaultFormState(): SearchPanelFormState {
	return {
		startTimestamp: moment().utc().subtract(30, 'minutes').valueOf(),
		searchDirection: SearchDirection.Next,
		resultCountLimit: 50,
		timeLimits: {
			previous: null,
			next: null,
		},
		stream: [],
		scope: '',
	};
}

export class SearchStore {
	constructor(
		private workspacesStore: WorkspacesStore,
		private api: ApiSchema,
		private filtersHistory: FiltersHistoryStore,
		private sessionsStore: SessionsStore,
		private booksStore: BooksStore,
	) {
		this.init();

		autorun(() => {
			this.currentSearch = getItemAt(this.searchHistory, this.currentIndex);
		});

		reaction(
			() => this.currentSearch?.timestamp,
			currentSearchTimestamp => {
				if (currentSearchTimestamp && this.currentSearch) {
					this.formType = this.currentSearch.request.type;
					this.searchForm = this.currentSearch.request.state;
					if (this.currentSearch.request.type === 'event') {
						this.eventsFilter = this.currentSearch.request.filters as EventFilterState;
					} else {
						this.messagesFilter = this.currentSearch.request.filters as MessageFilterState;
					}
				}
			},
		);

		reaction(
			() => this.booksStore.selectedBook,
			() => {
				this.stopSearch();
				this.getSearchHistory();
				this.resetSearchProgressState();
			},
		);
	}

	@observable searchChannel: {
		previous: EventSource | null;
		next: EventSource | null;
	} = {
		previous: null,
		next: null,
	};

	@observable eventsFilter: EventFilterState | null = null;

	@observable messagesFilter: MessageFilterState | null = null;

	@observable searchForm: SearchPanelFormState = getDefaultFormState();

	@observable formType: SearchPanelType = 'event';

	@observable searchHistory: SearchHistory[] = [];

	@observable currentIndex = this.searchHistory.length > 0 ? this.searchHistory.length - 1 : 0;

	@observable eventFilterInfo: EventsFiltersInfo[] = [];

	@observable messagesFilterInfo: MessagesFilterInfo[] = [];

	@observable isMessageFiltersLoading = false;

	@observable currentSearch: SearchHistory | null = null;

	@observable searchProgressState: {
		previous: SearchProgressState;
		next: SearchProgressState;
	} = {
		previous: {
			completed: this.searchHistory.length > 0,
			lastEventId: null,
			lastProcessedObjectCount: 0,
			resultCount: 0,
		},
		next: {
			completed: this.searchHistory.length > 0,
			lastEventId: null,
			lastProcessedObjectCount: 0,
			resultCount: 0,
		},
	};

	@observable isEventsFilterLoading = false;

	@observable eventAutocompleteList: EventTreeNode[] = [];

	@observable.ref eventAutocompleteSseChannel: EventSource | null = null;

	private resumeFromMessageIds: {
		previous: MessageIdsEvent | null;
		next: MessageIdsEvent | null;
	} = {
		previous: null,
		next: null,
	};

	@computed get searchProgress() {
		const startTimestamp = Number(this.searchForm.startTimestamp);
		const { previous: timeLimitPrevious, next: timeLimitNext } = this.searchForm.timeLimits;

		const timeIntervalPrevious = timeLimitPrevious ? startTimestamp - timeLimitPrevious : null;
		const timeIntervalNext = timeLimitNext ? timeLimitNext - startTimestamp : null;

		return {
			startTimestamp: this.searchForm.startTimestamp,
			completed: {
				previous: this.searchProgressState.previous.completed,
				next: this.searchProgressState.next.completed,
			},
			timeLimits: {
				previous: timeLimitPrevious,
				next: timeLimitNext,
			},
			timeIntervals: {
				previous: timeIntervalPrevious,
				next: timeIntervalNext,
			},
			progress: {
				previous:
					this.currentSearch && this.currentSearch.progress.previous
						? startTimestamp - this.currentSearch.progress.previous
						: 0,
				next:
					this.currentSearch && this.currentSearch.progress.next
						? this.currentSearch.progress.next - startTimestamp
						: 0,
			},
			processedObjectCount: this.currentSearch
				? this.currentSearch.processedObjectCount.previous +
				  this.currentSearch.processedObjectCount.next
				: 0,
		};
	}

	@computed get resultCount(): number {
		return (
			this.searchProgressState.previous.resultCount +
			this.searchProgressState.next.resultCount +
			this.searchChunk.length
		);
	}

	@computed get isSearching(): boolean {
		return Boolean(this.searchChannel.next || this.searchChannel.previous);
	}

	@computed get isCompleted() {
		const { searchDirection } = this.searchForm;

		if (!searchDirection) return false;

		if (searchDirection === SearchDirection.Both)
			return (
				this.searchProgressState[SearchDirection.Previous].completed &&
				this.searchProgressState[SearchDirection.Next].completed
			);

		return this.searchProgressState[searchDirection].completed;
	}

	@computed get isPaused() {
		return (
			!this.isSearching &&
			!this.isCompleted &&
			(!!this.searchProgressState.previous.lastEventId ||
				!!this.searchProgressState.next.lastEventId)
		);
	}

	private searchChunk: Array<
		| (SearchResult & { searchDirection: SSESearchDirection })
		| (SSEHeartbeat & { searchDirection: SSESearchDirection })
	> = [];

	@computed get isHistorySearch() {
		return this.searchHistory.length > 1 && this.currentIndex !== this.searchHistory.length - 1;
	}

	@computed get filters() {
		if (this.formType === 'event') {
			return this.eventsFilter
				? {
						info: this.eventFilterInfo,
						state: this.eventsFilter,
						setState: this.setEventsFilter,
						disableAll: this.isHistorySearch || this.isSearching,
				  }
				: null;
		}
		return this.messagesFilter
			? {
					info: this.messagesFilterInfo,
					state: this.messagesFilter,
					setState: this.setMessagesFilter,
					disableAll: this.isHistorySearch || this.isSearching,
			  }
			: null;
	}

	@computed get sortedResultGroups() {
		if (!this.currentSearch) return [];

		const searchDirection = this.currentSearch.request.state.searchDirection;

		return Object.entries(this.currentSearch.results).sort((a, b) => {
			if (searchDirection === SearchDirection.Previous) {
				return Number(b[0]) - Number(a[0]);
			}

			return Number(a[0]) - Number(b[0]);
		});
	}

	@action
	getEventFilters = async () => {
		this.isEventsFilterLoading = true;
		try {
			const filters = await this.api.sse.getEventFilters();
			const filtersInfo = await this.api.sse.getEventsFiltersInfo(filters);
			runInAction(() => {
				this.eventFilterInfo = filtersInfo;
				this.eventsFilter = getDefaultEventsFiltersState(filtersInfo);
			});
		} catch (error) {
			console.error('Error occured while loading event filters', error);
		} finally {
			runInAction(() => {
				this.isEventsFilterLoading = false;
			});
		}
	};

	@action
	getMessagesFilters = async () => {
		this.isMessageFiltersLoading = true;
		try {
			const filters = await this.api.sse.getMessagesFilters();
			const filtersInfo = await this.api.sse.getMessagesFiltersInfo(filters);
			runInAction(() => {
				this.messagesFilterInfo = filtersInfo;
				this.messagesFilter = getDefaultMessagesFiltersState(filtersInfo);
			});
		} catch (error) {
			console.error('Error occured while loading messages filters', error);
		} finally {
			runInAction(() => {
				this.isMessageFiltersLoading = false;
			});
		}
	};

	@action setFormType = (formType: SearchPanelType) => {
		this.formType = formType;
	};

	@action updateForm = (stateUpdate: Partial<SearchPanelFormState>) => {
		this.searchForm = {
			...this.searchForm,
			...stateUpdate,
		};

		this.resetSearchProgressState();
	};

	@action filterEventsByParent = (parentId: string, parentTimestamp: number) => {
		if (this.eventsFilter) {
			this.setFormType('event');
			this.stopSearch();
			this.eventsFilter.parentId.values = [parentId];
			this.searchForm.startTimestamp = parentTimestamp;
			this.resetSearchProgressState();
			this.workspacesStore.tabsStore.setActiveWorkspace(0);
		}
	};

	@action setEventsFilter = (patch: Partial<EventFilterState>) => {
		if (this.eventsFilter) {
			this.eventsFilter = {
				...this.eventsFilter,
				...patch,
			};
		}

		this.resetSearchProgressState();
	};

	@action setMessagesFilter = (patch: Partial<MessageFilterState>) => {
		if (this.messagesFilter) {
			this.messagesFilter = {
				...this.messagesFilter,
				...patch,
			};
		}

		this.resetSearchProgressState();
	};

	@action clearFilters = () => {
		if (!this.isSearching) {
			this.messagesFilter = getDefaultMessagesFiltersState(this.messagesFilterInfo);
			this.eventsFilter = getDefaultEventsFiltersState(this.eventFilterInfo);

			this.searchForm = getDefaultFormState();
		}
	};

	@action deleteHistoryItem = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = this.searchHistory.filter(item => item !== searchHistoryItem);
		this.currentIndex = Math.max(this.currentIndex - 1, 0);

		this.resetSearchProgressState();

		if (this.searchHistory.length !== 0) {
			this.setCompleted(true);
		}
		this.api.indexedDb.deleteDbStoreItem(
			IndexedDbStores.SEARCH_HISTORY,
			searchHistoryItem.timestamp,
		);
	};

	@action nextSearch = () => {
		if (this.currentIndex < this.searchHistory.length - 1) {
			this.currentIndex += 1;
			this.resetSearchProgressState();
			this.setCompleted(true);
		}
	};

	@action prevSearch = () => {
		if (this.currentIndex !== 0) {
			this.currentIndex = Math.max(this.currentIndex - 1, 0);
			this.resetSearchProgressState();
			this.setCompleted(true);
		}
	};

	@action newSearch = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = [...this.searchHistory, searchHistoryItem];
		this.currentIndex = Math.max(this.searchHistory.length - 1, 0);
		this.resetSearchProgressState();
	};

	@action updateSearchItem = (searchHistoryItem: Partial<SearchHistory>) => {
		this.searchHistory = this.searchHistory.map(item => {
			if (item === searchHistoryItem) {
				return {
					...item,
					...searchHistoryItem,
				};
			}

			return item;
		});
	};

	@action startSearch = (loadMore = false) => {
		const filterParams = this.formType === 'event' ? this.eventsFilter : this.messagesFilter;
		const bookId = this.booksStore.selectedBook.name;
		const scope = this.searchForm.scope;

		this.searchForm.stream = getArrayOfUniques(this.searchForm.stream);

		if (this.isSearching || !filterParams || (this.formType === 'event' && !scope.trim())) return;
		const isPaused = this.isPaused;
		this.setCompleted(false);

		if (loadMore) {
			if (isPaused) {
				this.startSearch();
				return;
			}

			this.searchProgressState[SearchDirection.Previous].resultCount = 0;
			this.searchProgressState[SearchDirection.Next].resultCount = 1;
		}

		if ((!isPaused && !loadMore) || this.currentSearch?.request.type !== this.formType) {
			this.newSearch({
				timestamp: moment().utc().valueOf(),
				request: {
					type: this.formType,
					state: this.searchForm,
					filters: filterParams,
					scope,
				} as any,
				bookId,
				results: {},
				progress: {
					previous: 0,
					next: 0,
				},
				processedObjectCount: {
					previous: 0,
					next: 0,
				},
			});
		}

		function getFilter<T extends keyof FilterState>(name: T) {
			return filterParams![name];
		}

		const {
			startTimestamp: _startTimestamp,
			searchDirection,
			resultCountLimit,
			timeLimits,
			stream,
		} = this.searchForm;

		const filtersToAdd = !this.filters
			? []
			: (this.filters.info as EventsFiltersInfo[])
					.filter((info: SSEFilterInfo) => getFilter(info.name).values.length !== 0)
					.filter(
						(info: SSEFilterInfo) =>
							info.name !== 'status' || getFilter(info.name).values !== 'any',
					)
					.map((info: SSEFilterInfo) => info.name);

		const filterValues: [string, string | string[]][] = filtersToAdd.map(filter => [
			`${filter}-${filter === 'status' ? 'value' : 'values'}`,
			getFilter(filter).values,
		]);

		const filterInclusion = filtersToAdd.map(filter =>
			getFilter(filter).negative ? [`${filter}-negative`, getFilter(filter).negative] : [],
		);

		const filterConjunct = filtersToAdd.map(filter =>
			getFilter(filter).conjunct ? [`${filter}-conjunct`, getFilter(filter).conjunct] : [],
		);

		const startDirectionalSearch = (direction: SSESearchDirection) => {
			const params = {
				startTimestamp: _startTimestamp,
				searchDirection: direction,
				resultCountLimit,
				endTimestamp: timeLimits[direction],
				filters: filtersToAdd,
				bookId: this.booksStore.selectedBook.name,
				scope,
				...Object.fromEntries([...filterValues, ...filterInclusion, ...filterConjunct]),
			};

			if (isPaused || loadMore) {
				if (this.formType === 'message') {
					const messageIdEvent = this.resumeFromMessageIds[direction];

					if (messageIdEvent) {
						params.messageId = Object.values(messageIdEvent).filter(Boolean);
					}
				} else {
					params.resumeFromId = this.searchProgressState[direction].lastEventId;
				}
			}

			if (isPaused) {
				params.resultCountLimit =
					this.currentSearch!.request.state.resultCountLimit -
					this.searchProgressState[direction].resultCount;
			}

			const queryParams: SSEParams =
				this.formType === 'event' ? { ...params } : { ...params, stream };

			const searchChannel = this.api.sse.getEventSource({
				type: this.formType,
				queryParams,
			});
			this.searchChannel[direction] = searchChannel;

			if (this.formType === 'event') {
				this.filtersHistory.onEventFilterSubmit(filterParams as EventFilterState);
			} else {
				this.sessionsStore.saveSessions(stream);
				this.filtersHistory.onMessageFilterSubmit(filterParams as MessageFilterState);
			}

			searchChannel.addEventListener(this.formType, this.onChannelResponse.bind(this, direction));
			searchChannel.addEventListener('keep_alive', this.onChannelResponse.bind(this, direction));
			searchChannel.addEventListener('message_ids', this.onMessageIdsEvent.bind(this, direction));
			searchChannel.addEventListener('close', this.stopSearch.bind(this, direction, undefined));
			searchChannel.addEventListener('error', this.onError.bind(this, direction));
		};

		if (searchDirection === SearchDirection.Both) {
			startDirectionalSearch(SearchDirection.Previous);
			startDirectionalSearch(SearchDirection.Next);
		} else if (searchDirection) {
			startDirectionalSearch(searchDirection);
		}
	};

	@action pauseSearch = () => {
		if (this.currentSearch) {
			const { processedObjectCount } = this.currentSearch;
			this.searchProgressState.previous.lastProcessedObjectCount = processedObjectCount.previous;
			this.searchProgressState.next.lastProcessedObjectCount = processedObjectCount.next;
		}

		this.stopSearch(undefined, true);
	};

	@action
	stopSearch = (searchDirection?: SSESearchDirection, pause = false) => {
		if (!searchDirection) {
			this.stopSearch(SearchDirection.Next, pause);
			this.stopSearch(SearchDirection.Previous, pause);
			return;
		}

		const searchChannel = this.searchChannel[searchDirection];

		if (!searchChannel) return;

		searchChannel.close();
		this.searchChannel[searchDirection] = null;

		if (!pause) {
			this.searchProgressState[searchDirection].completed = true;
		}

		this.exportChunkToSearchHistory();

		if (
			!this.isSearching &&
			this.currentSearch &&
			Object.values(this.currentSearch.results).some(results => results.length > 0)
		) {
			this.saveSearchResults(toJS(this.currentSearch));
		}
	};

	onError = (searchDirection: SSESearchDirection, ev: Event) => {
		if (ev instanceof MessageEvent) {
			notificationsStore.handleSSEError(ev);
		} else {
			const evSource = toJS(ev).currentTarget as EventSource;
			const errorId = nanoid();
			notificationsStore.addMessage({
				id: errorId,
				notificationType: 'genericError',
				header: `EventSource error - check the console.`,
				type: 'error',
				description: evSource ? `${ev.type} at ${evSource.url}` : `${ev.type}`,
			});
		}

		this.stopSearch(searchDirection);
	};

	private onChannelResponse = (searchDirection: SSESearchDirection, ev: Event) => {
		if (this.currentSearch) {
			const data = (ev as MessageEvent).data;
			const parsedEvent: SearchResult | SSEHeartbeat = JSON.parse(data);
			this.searchChunk.push({ ...parsedEvent, searchDirection });

			if (
				this.searchChunk.length >= SEARCH_CHUNK_SIZE ||
				(!isEventNode(parsedEvent) && !isEventMessage(parsedEvent))
			) {
				this.exportChunkToSearchHistory();
			}
		}
	};

	private onMessageIdsEvent = (searchDirection: SSESearchDirection, ev: Event) => {
		this.resumeFromMessageIds[searchDirection] =
			ev instanceof MessageEvent && ev.data ? JSON.parse(ev.data).messageIds : null;
	};

	@action
	exportChunkToSearchHistory() {
		this.searchChunk.forEach(eventWithSearchDirection => {
			if (!this.currentSearch) return;

			const { searchDirection, ...parsedEvent } = eventWithSearchDirection;

			const eventTimestamp =
				isEventNode(parsedEvent) || isEventMessage(parsedEvent)
					? getTimestampAsNumber(parsedEvent)
					: parsedEvent.timestamp;

			if (isEventNode(parsedEvent) || isEventMessage(parsedEvent)) {
				const resultGroupKey = getResultGroupKey(
					eventTimestamp,
					SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES,
				);

				if (!this.currentSearch.results[resultGroupKey]) {
					this.currentSearch.results[resultGroupKey] = [];
				}

				if (
					!this.currentSearch.results[resultGroupKey].find(
						entity => getItemId(entity) === getItemId(parsedEvent),
					)
				) {
					this.currentSearch.results[resultGroupKey].push(parsedEvent);
					this.searchProgressState[searchDirection].lastEventId = getItemId(parsedEvent);
					this.searchProgressState[searchDirection].resultCount += 1;
				}
				this.currentSearch.progress[searchDirection] = eventTimestamp;
			} else {
				if (eventTimestamp) {
					this.currentSearch.progress[searchDirection] = eventTimestamp;
				}

				this.currentSearch.processedObjectCount[searchDirection] =
					parsedEvent.scanCounter +
					this.searchProgressState[searchDirection].lastProcessedObjectCount;

				if (parsedEvent.id) {
					this.searchProgressState[searchDirection].lastEventId = parsedEvent.id;
				}
			}
		});

		this.searchChunk = [];
	}

	@action setCompleted(completed: boolean, searchDirection?: SSESearchDirection) {
		if (!searchDirection) {
			this.setCompleted(completed, SearchDirection.Next);
			this.setCompleted(completed, SearchDirection.Previous);
			return;
		}

		this.searchProgressState[searchDirection].completed = completed;
	}

	@action resetSearchProgressState() {
		this.searchProgressState = {
			previous: {
				completed: false,
				lastEventId: null,
				lastProcessedObjectCount: 0,
				resultCount: 0,
			},
			next: {
				completed: false,
				lastEventId: null,
				lastProcessedObjectCount: 0,
				resultCount: 0,
			},
		};

		this.resumeFromMessageIds = {
			previous: null,
			next: null,
		};
	}

	@action resetEventAutocompleteList = () => {
		this.eventAutocompleteSseChannel?.close();
		this.eventAutocompleteSseChannel = null;
		this.eventAutocompleteList = [];
	};

	private getSearchHistory = async (historyTimestamp?: number) => {
		try {
			const searchHistory = await this.api.indexedDb.getStoreValues<SearchHistory>(
				IndexedDbStores.SEARCH_HISTORY,
			);
			runInAction(() => {
				this.searchHistory = searchHistory.filter(
					search => search.bookId === this.booksStore.selectedBook.name,
				);
				const index = historyTimestamp
					? this.searchHistory.findIndex(search => search.timestamp === historyTimestamp)
					: -1;
				this.currentIndex = index === -1 ? Math.max(this.searchHistory.length - 1, 0) : index;
			});
		} catch (error) {
			console.error('Failed to load search history', error);
		}
	};

	private init = () => {
		this.getEventFilters();
		this.getMessagesFilters();
		this.getSearchHistory();
	};

	private saveSearchResults = async (search: SearchHistory) => {
		try {
			const savedSearchResultKeys = await this.api.indexedDb.getStoreKeys<number>(
				IndexedDbStores.SEARCH_HISTORY,
			);

			if (savedSearchResultKeys.includes(search.timestamp)) {
				await this.api.indexedDb.updateDbStoreItem(IndexedDbStores.SEARCH_HISTORY, search);
				return;
			}

			if (savedSearchResultKeys.length >= indexedDbLimits['search-history']) {
				const keysToDelete = savedSearchResultKeys.slice(
					0,
					savedSearchResultKeys.length - indexedDbLimits['search-history'] + 1,
				);
				await Promise.all(
					keysToDelete.map(searchHistoryKey =>
						this.api.indexedDb.deleteDbStoreItem(IndexedDbStores.SEARCH_HISTORY, searchHistoryKey),
					),
				);
			}
			await this.api.indexedDb.addDbStoreItem(IndexedDbStores.SEARCH_HISTORY, search);
		} catch (error) {
			if (error instanceof DOMException && error.code === error.QUOTA_EXCEEDED_ERR) {
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

	@action
	public syncData = async (unsavedData?: DbData) => {
		if (this.isSearching) {
			this.stopSearch();
		}

		await this.getSearchHistory();
		if (unsavedData && isSearchHistoryEntity(unsavedData)) {
			await this.saveSearchResults(unsavedData);
		}
	};
}
