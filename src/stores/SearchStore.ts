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

import { action, autorun, computed, observable, reaction, runInAction } from 'mobx';
import moment from 'moment';
import ApiSchema from '../api/ApiSchema';
import {
	EventsFiltersInfo,
	MessagesFilterInfo,
	SSEFilterInfo,
	SSEHeartbeat,
	SSEParams,
} from '../api/sse';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { getTimestampAsNumber } from '../helpers/date';
import { getItemId, isEventMessage, isEventNode } from '../helpers/event';
import { getDefaultEventsFiltersState, getDefaultMessagesFiltersState } from '../helpers/search';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { SearchDirection } from '../models/search/SearchDirection';
import localStorageWorker from '../util/LocalStorageWorker';
import notificationsStore from './NotificationsStore';

type SSESearchDirection = SearchDirection.Next | SearchDirection.Previous;

export type SearchPanelFormState = {
	startTimestamp: number | null;
	timeLimits: {
		previous: number | null;
		next: number | null;
	};
	resultCountLimit: number;
	searchDirection: SearchDirection | null;
	parentEvent: string;
	stream: string[];
};

export type SearchResult = EventTreeNode | EventMessage;

export type SearchHistory = {
	timestamp: number;
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
};

export type SearchHistoryState<T> = {
	index: number;
	limit: number;
	disableForward: boolean;
	disableBackward: boolean;
	currrentSearch: null | T;
	history: Array<T>;
};

const SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES = 1;
const SEARCH_CHUNK_SIZE = 500;

export class SearchStore {
	constructor(private api: ApiSchema) {
		this.getEventFilters();
		this.getMessagesFilters();
		this.loadMessageSessions();

		autorun(() => {
			this.currentSearch = this.searchHistory[this.currentIndex] || null;
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
	}

	private resultsCount = {
		previous: 0,
		next: 0,
	};

	@observable messageSessions: Array<string> = [];

	@observable searchChannel: {
		previous: EventSource | null;
		next: EventSource | null;
	} = {
		previous: null,
		next: null,
	};

	@observable eventsFilter: EventFilterState | null = null;

	@observable messagesFilter: MessageFilterState | null = null;

	@observable searchForm: SearchPanelFormState = {
		startTimestamp: moment().utc().subtract(30, 'minutes').valueOf(),
		searchDirection: SearchDirection.Next,
		resultCountLimit: 50,
		timeLimits: {
			previous: null,
			next: null,
		},
		parentEvent: '',
		stream: [],
	};

	@observable formType: SearchPanelType = 'event';

	@observable searchHistory: SearchHistory[] = localStorageWorker.getSearchHistory();

	@observable currentIndex = this.searchHistory.length > 0 ? this.searchHistory.length - 1 : 0;

	@observable eventFilterInfo: EventsFiltersInfo[] = [];

	@observable messagesFilterInfo: MessagesFilterInfo[] = [];

	@observable isMessageFiltersLoading = false;

	@computed get searchProgress() {
		const startTimestamp = Number(this.searchForm.startTimestamp);
		const { previous: timeLimitPrevious, next: timeLimitNext } = this.searchForm.timeLimits;

		const timeIntervalPrevious = timeLimitPrevious ? startTimestamp - timeLimitPrevious : null;
		const timeIntervalNext = timeLimitNext ? timeLimitNext - startTimestamp : null;

		return {
			startTimestamp: this.searchForm.startTimestamp,
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
			searching: this.isSearching,
			completed: this.completed,
			processedObjectCount: this.currentSearch?.processedObjectCount
				? this.currentSearch.processedObjectCount.previous +
				  this.currentSearch.processedObjectCount.next
				: 0,
		};
	}

	@computed get isSearching(): boolean {
		return Boolean(this.searchChannel.next || this.searchChannel.previous);
	}

	@computed get isCompleted() {
		const { searchDirection } = this.searchForm;

		if (!searchDirection) return false;

		if (searchDirection === SearchDirection.Both)
			return this.completed[SearchDirection.Previous] && this.completed[SearchDirection.Next];

		return this.completed[searchDirection];
	}

	@observable currentSearch: SearchHistory | null = null;

	@observable completed = {
		previous: this.searchHistory.length > 0,
		next: this.searchHistory.length > 0,
	};

	@observable lastEventId: {
		previous: string | null;
		next: string | null;
	} = {
		previous: null,
		next: null,
	};

	@computed get isPaused() {
		return (
			!this.isSearching &&
			!this.isCompleted &&
			(!!this.lastEventId.previous || !!this.lastEventId.next)
		);
	}

	private searchChunk: Array<
		| (SearchResult & { searchDirection: SSESearchDirection })
		| (SSEHeartbeat & { searchDirection: SSESearchDirection })
	> = [];

	@computed get isFormDisabled() {
		return this.searchHistory.length > 1 && this.currentIndex !== this.searchHistory.length - 1;
	}

	@computed get filters() {
		if (this.formType === 'event') {
			return this.eventsFilter
				? {
						info: this.eventFilterInfo,
						state: this.eventsFilter,
						setState: this.setEventsFilter,
						disableAll: this.isFormDisabled,
				  }
				: null;
		}
		return this.messagesFilter
			? {
					info: this.messagesFilterInfo,
					state: this.messagesFilter,
					setState: this.setMessagesFilter,
					disableAll: this.isFormDisabled,
			  }
			: null;
	}

	@computed get sortedResultGroups() {
		if (!this.currentSearch) return [];

		const { startTimestamp, searchDirection } = this.currentSearch.request.state;

		return Object.entries(this.currentSearch.results).sort((a, b) => {
			const firstResultTimestamp = +a[0] * 1000 * SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES * 60;
			const secondResultTimestamp = +b[0] * 1000 * SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES * 60;

			if (searchDirection === SearchDirection.Both) {
				return (
					Math.abs(firstResultTimestamp - (startTimestamp || 0)) -
					Math.abs(secondResultTimestamp - (startTimestamp || 0))
				);
			}

			return (
				(firstResultTimestamp - secondResultTimestamp) *
				(searchDirection === SearchDirection.Next ? 1 : -1)
			);
		});
	}

	@action
	getEventFilters = async () => {
		try {
			const filters = await this.api.sse.getEventFilters();
			const filtersInfo = await this.api.sse.getEventsFiltersInfo(filters);
			runInAction(() => {
				this.eventFilterInfo = filtersInfo;
				this.eventsFilter = getDefaultEventsFiltersState(filtersInfo);
			});
		} catch (error) {
			console.error('Error occured while loading event filters', error);
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
			this.isMessageFiltersLoading = false;
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

		this.setCompleted(false);
		this.resetResultsState();
	};

	@action setEventsFilter = (patch: Partial<EventFilterState>) => {
		if (this.eventsFilter) {
			this.eventsFilter = {
				...this.eventsFilter,
				...patch,
			};
		}

		this.setCompleted(false);
		this.resetResultsState();
	};

	@action setMessagesFilter = (patch: Partial<MessageFilterState>) => {
		if (this.messagesFilter) {
			this.messagesFilter = {
				...this.messagesFilter,
				...patch,
			};
		}

		this.setCompleted(false);
		this.resetResultsState();
	};

	@action deleteHistoryItem = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = this.searchHistory.filter(item => item !== searchHistoryItem);
		this.currentIndex = Math.max(this.currentIndex - 1, 0);

		if (this.searchHistory.length === 0) {
			this.setCompleted(false);
		}

		this.resetResultsState();

		localStorageWorker.saveSearchHistory(this.searchHistory);
	};

	@action nextSearch = () => {
		if (this.currentIndex < this.searchHistory.length - 1) {
			this.currentIndex += 1;
			this.setCompleted(true);
			this.resetResultsState();
		}
	};

	@action prevSearch = () => {
		if (this.currentIndex !== 0) {
			this.currentIndex -= 1;
			this.setCompleted(true);
			this.resetResultsState();
		}
	};

	@action newSearch = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = [...this.searchHistory, searchHistoryItem];
		this.currentIndex = this.searchHistory.length - 1;
		this.setCompleted(false);
		this.resetResultsState();
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
		if (this.isSearching || !filterParams) return;
		const isPaused = this.isPaused;
		this.setCompleted(false);

		if (loadMore) {
			if (isPaused) {
				this.startSearch();
				return;
			}

			this.resetResultsCount();
		}

		if (!isPaused && !loadMore) {
			this.newSearch({
				timestamp: moment().utc().valueOf(),
				request: { type: this.formType, state: this.searchForm, filters: filterParams },
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
			parentEvent,
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

		const filterValues = filtersToAdd.map(filter => [
			`${filter}-${filter === 'status' ? 'value' : 'values'}`,
			getFilter(filter).values,
		]);

		const filterInclusion = filtersToAdd.map(filter =>
			getFilter(filter).negative ? [`${filter}-negative`, getFilter(filter).negative] : [],
		);

		const startDirectionalSearch = (direction: SSESearchDirection) => {
			const params = {
				startTimestamp: _startTimestamp,
				searchDirection: direction,
				resultCountLimit,
				endTimestamp: timeLimits[direction],
				filters: filtersToAdd,
				...Object.fromEntries([...filterValues, ...filterInclusion]),
			};

			if (isPaused || loadMore) {
				params.resumeFromId = this.lastEventId[direction];
			}

			if (isPaused) {
				params.resultCountLimit =
					this.currentSearch!.request.state.resultCountLimit - this.resultsCount[direction];
			}

			const queryParams: SSEParams =
				this.formType === 'event' ? { ...params, parentEvent } : { ...params, stream };

			const searchChannel = this.api.sse.getEventSource({
				type: this.formType,
				queryParams,
			});

			this.searchChannel[direction] = searchChannel;

			searchChannel.addEventListener(this.formType, this.onChannelResponse.bind(this, direction));
			searchChannel.addEventListener('keep_alive', this.onChannelResponse.bind(this, direction));
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
			this.completed[searchDirection] = true;
		}

		this.exportChunkToSearchHistory();

		if (!this.isSearching) {
			localStorageWorker.saveSearchHistory(this.searchHistory);
		}
	};

	onError = (searchDirection: SSESearchDirection, ev: Event) => {
		notificationsStore.handleSSEError(ev);

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

			if (
				this.resultsCount.previous + this.resultsCount.next + this.searchChunk.length >=
				this.currentSearch.request.state.resultCountLimit
			) {
				this.stopSearch();
			}
		}
	};

	@action
	private async loadMessageSessions() {
		try {
			const messageSessions = await this.api.messages.getMessageSessions();
			runInAction(() => {
				this.messageSessions = messageSessions;
			});
		} catch (error) {
			console.error("Couldn't fetch sessions");
		}
	}

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
				const resultGroupKey = Math.floor(
					eventTimestamp / 1000 / (SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES * 60),
				).toString();

				if (!this.currentSearch.results[resultGroupKey]) {
					this.currentSearch.results[resultGroupKey] = [];
				}

				this.currentSearch.results[resultGroupKey].push(parsedEvent);
				this.currentSearch.progress[searchDirection] = eventTimestamp;
				this.lastEventId[searchDirection] = getItemId(parsedEvent);
				this.resultsCount[searchDirection] += 1;
			} else {
				this.currentSearch.progress[searchDirection] = eventTimestamp;
				this.currentSearch.processedObjectCount[searchDirection] = parsedEvent.scanCounter;
				this.lastEventId[searchDirection] = parsedEvent.id;
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

		this.completed[searchDirection] = completed;
	}

	@action resetResultsCount(searchDirection?: SSESearchDirection) {
		if (!searchDirection) {
			this.resetResultsCount(SearchDirection.Previous);
			this.resetResultsCount(SearchDirection.Next);
			return;
		}

		this.resultsCount[searchDirection] = 0;
	}

	@action resetLastEventId(searchDirection?: SSESearchDirection) {
		if (!searchDirection) {
			this.resetLastEventId(SearchDirection.Previous);
			this.resetLastEventId(SearchDirection.Next);
			return;
		}

		this.lastEventId[searchDirection] = null;
	}

	@action resetResultsState() {
		this.resetResultsCount();
		this.resetLastEventId();
	}
}
