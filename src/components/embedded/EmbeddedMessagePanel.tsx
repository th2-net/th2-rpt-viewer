/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
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

import React, { useEffect, useState } from 'react';
import { EventMessage, MessageViewType } from '../../models/EventMessage';
import SplashScreen from '../SplashScreen';
import { MessageCardBase } from '../message/message-card/MessageCard';
import { IndexedDB } from '../../api/indexedDb';
import '../../styles/embedded.scss';
import {
	MessagesSSEParams,
	SSEHeartbeat,
	SSEParams,
	SSEFilterInfo,
	EventsFiltersInfo,
	MessagesFilterInfo,
} from '../../api/sse';
import moment from 'moment';
import MessagesFilter from '../../models/filter/MessagesFilter';
import {
	MessageFilterState,
	EventFilterState,
	FilterState,
} from '../search-panel/SearchPanelFilters';
import { MessagesSSELoader } from '../../stores/messages/MessagesSSELoader';
import ApiSchema from '../../api/ApiSchema';
import {
	reaction,
	observable,
	computed,
	action,
	runInAction,
	toJS,
	autorun,
	IReactionDisposer,
} from 'mobx';
import { isEventMessage, getItemId, isEventNode } from '../../helpers/event';
import notificationsStore from '../../stores/NotificationsStore';
import { timestampToNumber, getTimestampAsNumber } from '../../helpers/date';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { TimeRange } from '../../models/Timestamp';
import { ListRange, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import api from '../../api/index';
import {
	isSearchHistoryEntity,
	getDefaultMessagesFiltersState,
	getDefaultEventsFiltersState,
} from '../../helpers/search';
import { DbData, IndexedDbStores, indexedDbLimits } from '../../api/indexedDb';
import { nanoid } from 'nanoid';
import { SearchDirection } from '../../models/search/SearchDirection';
import { SearchPanelType } from '../search-panel/SearchPanel';
import { EventTreeNode } from '../../models/EventAction';
import { SessionsStore } from '../../stores/messages/SessionsStore';
import FiltersHistoryStore from '../../stores/FiltersHistoryStore';
import { Observer } from 'mobx-react-lite';
import { useDebouncedCallback } from '../../hooks';
import { raf } from '../../helpers/raf';

const SEARCH_TIME_FRAME = 15;
const FIFTEEN_SECONDS = 15 * 1000;

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

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

function getDefaultMessagesFilter(): MessagesFilter {
	const searchParams = new URLSearchParams(window.location.search);
	const sessions: string[] = [];
	const session = searchParams.get('session');

	function defineSessions(): string[] {
		if (session) sessions[0] = session;
		return sessions;
	}
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: defineSessions(),
	};
}

export type MessagesFilterStoreInitialState = {
	sse?: Partial<MessageFilterState> | null;
	isSoftFilter?: boolean;
} & Partial<MessagesFilter>;

export class MessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(
		private searchStore: EmbeddedSearchStore,
		initialState?: MessagesFilterStoreInitialState,
	) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(() => searchStore.messagesFilterInfo, this.initSSEFilter);
	}

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	@observable sseMessagesFilter: MessageFilterState | null = null;

	/*
		  When isSoftFilter is applied messages that don't match filter are not excluded,
		  instead we highlight messages that matched filter
	  */
	@observable isSoftFilter = false;

	@computed
	public get filterParams(): MessagesSSEParams {
		const sseFilters = this.sseMessagesFilter;

		const filtersToAdd: Array<keyof MessageFilterState> = !sseFilters
			? []
			: Object.entries(sseFilters)
					.filter(([_, filter]) => filter.values.length > 0)
					.map(([filterName]) => filterName as keyof MessageFilterState);

		const filterValues = filtersToAdd
			.map(filterName =>
				sseFilters ? [`${filterName}-values`, sseFilters[filterName].values] : [],
			)
			.filter(Boolean);

		const filterInclusion = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName].negative
				? [`${filterName}-negative`, sseFilters[filterName].negative]
				: [],
		);

		const filterConjunct = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName].conjunct
				? [`${filterName}-conjunct`, sseFilters[filterName].conjunct]
				: [],
		);

		const endTimestamp = moment().utc().subtract(30, 'minutes').valueOf();
		const startTimestamp = moment(endTimestamp).add(5, 'minutes').valueOf();

		const queryParams: MessagesSSEParams = {
			startTimestamp: this.filter.timestampTo || startTimestamp,
			stream: this.filter.streams,
			searchDirection: 'previous',
			resultCountLimit: 15,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion, ...filterConjunct]),
		};

		return queryParams;
	}
	@computed
	public get softFilterParams(): MessagesSSEParams {
		return {
			startTimestamp: this.filterParams.startTimestamp,
			stream: this.filterParams.stream,
			searchDirection: this.filterParams.searchDirection,
			endTimestamp: this.filterParams.endTimestamp,
			resultCountLimit: this.filterParams.resultCountLimit,
			resumeFromId: this.filterParams.resumeFromId,
		};
	}
	@computed
	public get isMessagesFilterApplied() {
		return [
			this.sseMessagesFilter
				? [
						this.sseMessagesFilter.attachedEventIds.values,
						this.sseMessagesFilter.body.values,
						this.sseMessagesFilter.type.values,
				  ].flat()
				: [],
		].some(filter => filter.length > 0);
	}

	@action
	public setMessagesFilter(
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null = null,
		isSoftFilterApplied: boolean,
	) {
		this.isSoftFilter = isSoftFilterApplied;
		this.sseMessagesFilter = sseFilters;
		this.filter = filter;
	}

	@action
	public resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = getDefaultMessagesFiltersState(this.searchStore.messagesFilterInfo);
		const defaultMessagesFilter = getDefaultMessagesFilter();
		this.isSoftFilter = false;
		this.sseMessagesFilter = filter;
		this.filter = {
			...defaultMessagesFilter,
			timestampFrom: this.filter.timestampFrom,
			timestampTo: this.filter.timestampTo,
			...initFilter,
		};
	};

	private init = (initialState?: MessagesFilterStoreInitialState) => {
		if (initialState) {
			const defaultMessagesFilter = getDefaultMessagesFilter();
			const {
				streams = defaultMessagesFilter.streams,
				timestampFrom = defaultMessagesFilter.timestampFrom,
				timestampTo = defaultMessagesFilter.timestampTo,
				sse = {},
				isSoftFilter = false,
			} = initialState;

			const appliedSSEFilter = {
				...(getDefaultMessagesFiltersState(this.searchStore.messagesFilterInfo) || {}),
				...sse,
			} as MessageFilterState;
			this.setMessagesFilter(
				{
					streams,
					timestampFrom,
					timestampTo,
				},
				Object.keys(appliedSSEFilter).length > 0 ? appliedSSEFilter : null,
				isSoftFilter,
			);
		} else {
			this.setSSEMessagesFilter(this.searchStore.messagesFilterInfo);
		}
	};

	@action
	private setSSEMessagesFilter = (messagesFilterInfo: MessagesFilterInfo[]) => {
		this.sseMessagesFilter = getDefaultMessagesFiltersState(messagesFilterInfo);
	};

	@action
	private initSSEFilter = (filterInfo: MessagesFilterInfo[]) => {
		if (this.sseMessagesFilter) {
			const defaultState = getDefaultMessagesFiltersState(filterInfo) || {};
			this.sseMessagesFilter = {
				...defaultState,
				...this.sseMessagesFilter,
			};
		} else {
			this.setSSEMessagesFilter(filterInfo);
		}
	};

	@action
	public setSoftFilter = (isChecked: boolean): void => {
		this.isSoftFilter = isChecked;
	};

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
//
//
//
//
//
//
//
//
//
//

export class EmbeddedSearchStore {
	constructor(private api: ApiSchema, private sessionsStore: SessionsStore) {
		this.init();

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

		const startTimestamp = this.currentSearch.request.state.startTimestamp || 0;

		return Object.entries(this.currentSearch.results).sort((a, b) => {
			const [firstResultGroupTimestamp, secondResultGroupTimestamp] = [a, b].map(
				resultGroup => +resultGroup[0] * 1000 * SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES * 60,
			);

			return (
				Math.abs(firstResultGroupTimestamp - startTimestamp) -
				Math.abs(secondResultGroupTimestamp - startTimestamp)
			);
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
			this.currentIndex -= 1;
			this.resetSearchProgressState();
			this.setCompleted(true);
		}
	};

	@action newSearch = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = [...this.searchHistory, searchHistoryItem];
		this.currentIndex = this.searchHistory.length - 1;
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
		if (this.isSearching || !filterParams) return;
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
				...Object.fromEntries([...filterValues, ...filterInclusion, ...filterConjunct]),
			};

			if (isPaused || loadMore) {
				params.resumeFromId = this.searchProgressState[direction].lastEventId;
			}

			if (isPaused) {
				params.resultCountLimit =
					this.currentSearch!.request.state.resultCountLimit -
					this.searchProgressState[direction].resultCount;
			}

			const queryParams: SSEParams =
				this.formType === 'event' ? { ...params, parentEvent } : { ...params, stream };

			const searchChannel = this.api.sse.getEventSource({
				type: this.formType,
				queryParams,
			});

			this.searchChannel[direction] = searchChannel;

			if (this.formType !== 'event') {
				this.sessionsStore.saveSessions(stream);
			}

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

			if (this.resultCount >= this.currentSearch.request.state.resultCountLimit) {
				this.stopSearch();
			}
		}
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
				const resultGroupKey = Math.floor(
					eventTimestamp / 1000 / (SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES * 60),
				).toString();

				if (!this.currentSearch.results[resultGroupKey]) {
					this.currentSearch.results[resultGroupKey] = [];
				}

				this.currentSearch.results[resultGroupKey].push(parsedEvent);
				this.currentSearch.progress[searchDirection] = eventTimestamp;
				this.searchProgressState[searchDirection].lastEventId = getItemId(parsedEvent);
				this.searchProgressState[searchDirection].resultCount += 1;
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
	}

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

	private getSearchHistory = async (historyTimestamp?: number) => {
		try {
			const searchHistory = await this.api.indexedDb.getStoreValues<SearchHistory>(
				IndexedDbStores.SEARCH_HISTORY,
			);
			runInAction(() => {
				this.searchHistory = searchHistory;
				const defaultIndex = searchHistory.length - 1;
				const index = historyTimestamp
					? searchHistory.findIndex(search => search.timestamp === historyTimestamp)
					: -1;
				this.currentIndex = index === -1 ? defaultIndex : index;
			});
		} catch (error) {
			console.error('Failed to load search history', error);
		}
	};

	private init = () => {
		this.getEventFilters();
		this.getMessagesFilters();
		this.loadMessageSessions();
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
			notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'error',
				header: `Failed to save current search result`,
				description: '',
				id: nanoid(),
			});
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
//
//
//
//
//
//
//

export class EmbeddedMessagesStore {
	public filterStore = new MessagesFilterStore(this.searchStore);

	public dataStore = new EmbeddedMessagesDataProviderStore(this, this.api);

	@observable
	public hoveredMessage: EventMessage | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: Array<string> = [];

	@observable
	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

	@observable
	public showFilterChangeHint = false;

	/*
		  This is used for filter change hint. Represents either last clicked message
		  or attached messages
	  */
	public hintMessages: EventMessage[] = [];

	constructor(
		private filterHistoryStore: FiltersHistoryStore,
		private searchStore: EmbeddedSearchStore,
		private api: ApiSchema,
		private sessionsStore: SessionsStore,
		defaultState?: MessagesStoreDefaultStateType,
	) {
		this.init(defaultState);
		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	private init = async (defaultState: MessagesStoreDefaultStateType) => {
		if (!defaultState) {
			return;
		}
		if (typeof defaultState === 'string') {
			try {
				const message = await this.api.messages.getMessage(defaultState);
				this.onMessageSelect(message);
			} catch (error) {
				console.error(`Couldnt fetch target message ${defaultState}`);
			}
		} else {
			this.filterStore = new MessagesFilterStore(this.searchStore, defaultState);
			const message = defaultState.targetMessage;
			if (isEventMessage(message)) {
				this.selectedMessageId = new String(message.messageId);
				this.highlightedMessageId = message.messageId;
			}
		}
		this.dataStore.loadMessages();
	};

	@computed
	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;

		const messageTo = this.dataStore.messages[startIndex];
		const messageFrom = this.dataStore.messages[endIndex];

		if (messageFrom && messageTo) {
			return [timestampToNumber(messageFrom.timestamp), timestampToNumber(messageTo.timestamp)];
		}
		const timestampTo = this.filterStore.filter.timestampTo || moment().utc().valueOf();
		return [timestampTo - 15 * 1000, timestampTo + 15 * 1000];
	}

	@action
	public setHoveredMessage(message: EventMessage | null) {
		this.hoveredMessage = message;
	}

	@action
	public showDetailedRawMessage = (messageId: string) => {
		if (!this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	@action
	public hideDetailedRawMessage = (messageId: string) => {
		this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
	};

	@action
	public beautify = (messageId: string) => {
		if (!this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	@action
	public debeautify = (messageId: string) => {
		this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
	};

	@action
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.dataStore.messages.findIndex(m => m.messageId === messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	@action
	public applyFilter = (
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	) => {
		if (sseFilters) {
			this.filterHistoryStore.onMessageFilterSubmit(sseFilters);
		}

		this.sessionsStore.saveSessions(filter.streams);
		this.hintMessages = [];
		this.showFilterChangeHint = false;
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.filterStore.setMessagesFilter(filter, sseFilters, isSoftFilterApplied);
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const shouldShowFilterHintBeforeRefetchingMessages = this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const streams = this.filterStore.filter.streams;
			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: timestampToNumber(message.timestamp),
				streams: [...new Set([...streams, message.sessionId])],
			});
			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = message.messageId;
			this.hintMessages = [];
		}
	};

	@action
	public onAttachedMessagesChange = (attachedMessages: EventMessage[]) => {
		const shouldShowFilterHintBeforeRefetchingMessages = this.handleFilterHint(attachedMessages);

		if (
			this.dataStore.isLoadingNextMessages ||
			this.dataStore.isLoadingPreviousMessages ||
			shouldShowFilterHintBeforeRefetchingMessages
		) {
			return;
		}

		const mostRecentMessage = sortMessagesByTimestamp(attachedMessages)[0];

		if (mostRecentMessage) {
			const streams = this.filterStore.filter.streams;
			this.filterStore.filter = {
				...this.filterStore.filter,
				streams: [...new Set([...streams, ...attachedMessages.map(({ sessionId }) => sessionId)])],
				timestampTo: timestampToNumber(mostRecentMessage.timestamp),
			};
			this.selectedMessageId = new String(mostRecentMessage.messageId);
		}
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.hintMessages = [];

		this.filterStore.filter = {
			...this.filterStore.filter,
			timestampFrom: null,
			timestampTo: timestamp,
		};
	};

	@action
	public clearFilters = () => {
		this.hintMessages = [];
		this.filterStore.resetMessagesFilter({ streams: this.filterStore.filter.streams });
		this.dataStore.stopMessagesLoading();
	};

	@action
	/*
		  This method handles message select or attached messages change events.
		  When those events occur we want to check if selected message or
		  attached messages match current filter and streams. If it doesn't match
		  filter change hint window is shown to a user. And it is up to him to decide
		  if he wants to reset streams to message(s) streams and update filters
	  */
	private handleFilterHint = (message: EventMessage | EventMessage[]): boolean => {
		this.hintMessages = Array.isArray(message) ? message : [message];

		if (this.hintMessages.length === 0) {
			this.showFilterChangeHint = false;
			return this.showFilterChangeHint;
		}

		const sseFilter = this.filterStore.sseMessagesFilter;
		const areFiltersApplied = [
			sseFilter
				? [sseFilter.attachedEventIds.values, sseFilter.body.values, sseFilter.type.values].flat()
				: [],
		].some(filterValues => filterValues.length > 0);

		this.showFilterChangeHint = areFiltersApplied;

		return this.showFilterChangeHint;
	};

	@action
	public applyFilterHint = () => {
		if (!this.hintMessages.length) return;

		this.dataStore.searchChannelNext?.stop();
		this.dataStore.searchChannelPrev?.stop();

		const targetMessage: EventMessage = sortMessagesByTimestamp(this.hintMessages)[0];

		this.filterStore.resetMessagesFilter({
			streams: [...new Set(this.hintMessages.map(({ sessionId }) => sessionId))],
			timestampTo: timestampToNumber(targetMessage.timestamp),
			timestampFrom: null,
		});

		this.hintMessages = [];
		this.selectedMessageId = new String(targetMessage.messageId);
		this.highlightedMessageId = targetMessage.messageId;
		this.showFilterChangeHint = false;
	};

	// Unsubcribe from reactions
	public dispose = () => {
		this.filterStore.dispose();
		this.dataStore.stopMessagesLoading();
	};
}
//
//
//
//
//
//
//
export class EmbeddedMessagesDataProviderStore {
	constructor(private messagesStore: EmbeddedMessagesStore, private api: ApiSchema) {
		reaction(() => this.messagesStore.filterStore.filter, this.onFilterChange);
	}

	@observable
	public noMatchingMessagesPrev = false;

	@observable
	public noMatchingMessagesNext = false;

	@observable
	public messagesListErrorStatusCode: number | null = null;

	@observable.shallow
	public messages: Array<EventMessage> = [];

	@observable
	public isError = false;

	@observable
	public searchChannelPrev: MessagesSSELoader | null = null;

	@observable
	public searchChannelNext: MessagesSSELoader | null = null;

	@observable
	public startIndex = 10000;

	@observable
	public initialItemCount = 0;

	@observable
	public isSoftFiltered: Map<string, boolean> = new Map();

	@observable
	public isMatchingMessages: Map<string, boolean> = new Map();

	prevLoadEndTimestamp: number | null = null;

	nextLoadEndTimestamp: number | null = null;

	private lastPreviousChannelResponseTimestamp: number | null = null;

	private lastNextChannelResponseTimestamp: number | null = null;

	@computed
	public get isLoadingNextMessages(): boolean {
		return Boolean(this.searchChannelNext?.isLoading);
	}

	@computed
	public get isLoadingPreviousMessages(): boolean {
		return Boolean(this.searchChannelPrev?.isLoading);
	}

	@computed
	public get isLoading(): boolean {
		return this.isLoadingNextMessages || this.isLoadingPreviousMessages;
	}

	@computed
	public get getMessages(): EventMessage[] {
		return this.messages;
	}

	private messageAC: AbortController | null = null;

	@action
	public loadMessages = async () => {
		this.stopMessagesLoading();

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const queryParams = this.messagesStore.filterStore.filterParams;

		this.createPreviousMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'previous',
			},
			SEARCH_TIME_FRAME,
		);
		this.createNextMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'next',
			},
			SEARCH_TIME_FRAME,
		);

		let message: EventMessage | undefined;
		if (this.searchChannelPrev && this.searchChannelNext) {
			if (this.messagesStore.selectedMessageId) {
				this.messageAC = new AbortController();
				try {
					message = await this.api.messages.getMessage(
						this.messagesStore.selectedMessageId.valueOf(),
						this.messageAC.signal,
					);
				} catch (error) {
					if (error.name !== 'AbortError') {
						this.isError = true;
						return;
					}
				}
			}
			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.loadAndSubscribe(message?.messageId),
				this.searchChannelPrev.loadAndSubscribe(message?.messageId),
			]);

			const firstNextMessage = nextMessages[nextMessages.length - 1];

			if (firstNextMessage && firstNextMessage.messageId === prevMessages[0]?.messageId) {
				nextMessages.pop();
			}

			runInAction(() => {
				const messages = [...nextMessages, ...[message].filter(isEventMessage), ...prevMessages];

				this.messages = messages;

				this.initialItemCount = messages.length;
			});

			if (this.messagesStore.selectedMessageId) {
				this.messagesStore.scrollToMessage(this.messagesStore.selectedMessageId?.valueOf());
			} else {
				const firstPrevMessage = prevMessages[0];
				if (firstPrevMessage) {
					this.messagesStore.scrollToMessage(firstPrevMessage.messageId);
				}
			}
		}

		if (this.messagesStore.filterStore.isSoftFilter && message) {
			this.isSoftFiltered.set(message.messageId, true);
		}
	};

	@action
	public stopMessagesLoading = (isError = false) => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.resetMessagesDataState(isError);
	};

	@action
	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopMessagesLoading(true);
	};

	@action
	public createPreviousMessageChannelEventSource = (
		query: MessagesSSEParams,
		interval?: number,
	) => {
		this.prevLoadEndTimestamp = null;

		this.searchChannelPrev = new MessagesSSELoader(
			query,
			this.onPrevChannelResponse,
			this.onLoadingError,
			typeof interval === 'number' ? this.onKeepAliveMessagePrevious : undefined,
		);
	};

	private onKeepAliveMessagePrevious = (e: SSEHeartbeat) => {
		if (this.lastPreviousChannelResponseTimestamp === null) {
			this.lastPreviousChannelResponseTimestamp = Date.now();
		}
		if (
			this.lastPreviousChannelResponseTimestamp !== null &&
			Date.now() - this.lastPreviousChannelResponseTimestamp >= FIFTEEN_SECONDS
		) {
			runInAction(() => {
				this.noMatchingMessagesPrev = true;
				this.prevLoadEndTimestamp = e.timestamp;
				this.searchChannelPrev?.stop();
			});
		}
	};

	@action
	public onPrevChannelResponse = (messages: EventMessage[]) => {
		this.lastPreviousChannelResponseTimestamp = null;
		const firstPrevMessage = messages[0];

		if (
			firstPrevMessage &&
			firstPrevMessage.messageId === this.messages[this.messages.length - 1]?.messageId
		) {
			messages.shift();
		}

		if (messages.length) {
			this.messages = [...this.messages, ...messages];

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.messageId === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	@action
	public createNextMessageChannelEventSource = (query: MessagesSSEParams, interval?: number) => {
		this.nextLoadEndTimestamp = null;

		this.searchChannelNext = new MessagesSSELoader(
			query,
			this.onNextChannelResponse,
			this.onLoadingError,
			typeof interval === 'number' ? this.onKeepAliveMessageNext : undefined,
		);
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;
		const firstNextMessage = messages[this.messages.length - 1];

		if (firstNextMessage && firstNextMessage.messageId === this.messages[0]?.messageId) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.startIndex -= messages.length;
			this.messages = [...messages, ...this.messages];

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.messageId === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	private onKeepAliveMessageNext = (e: SSEHeartbeat) => {
		if (this.lastNextChannelResponseTimestamp === null) {
			this.lastNextChannelResponseTimestamp = Date.now();
		}
		if (
			this.lastNextChannelResponseTimestamp !== null &&
			Date.now() - this.lastNextChannelResponseTimestamp >= FIFTEEN_SECONDS
		) {
			runInAction(() => {
				this.noMatchingMessagesNext = true;
				this.nextLoadEndTimestamp = e.timestamp;
				this.searchChannelNext?.stop();
			});
		}
	};

	@action
	public getPreviousMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelPrev || this.searchChannelPrev.isLoading) {
			return [];
		}

		return this.searchChannelPrev.loadAndSubscribe(resumeFromId);
	};

	@action
	public getNextMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelNext || this.searchChannelNext.isLoading) {
			return [];
		}

		return this.searchChannelNext.loadAndSubscribe(resumeFromId);
	};

	@action
	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.resetMessagesDataState();
		this.loadMessages();
	};

	@action
	private resetMessagesDataState = (isError = false) => {
		this.initialItemCount = 0;
		this.startIndex = 10000;
		this.messages = [];
		this.isError = isError;
		this.isSoftFiltered.clear();
		this.isMatchingMessages.clear();
		this.noMatchingMessagesNext = false;
		this.noMatchingMessagesPrev = false;
		this.prevLoadEndTimestamp = null;
		this.nextLoadEndTimestamp = null;
		this.lastPreviousChannelResponseTimestamp = null;
		this.lastNextChannelResponseTimestamp = null;
	};

	@observable
	public messagesCache: Map<string, EventMessage> = observable.map(new Map(), { deep: false });

	@action
	public fetchMessage = async (id: string, abortSingal: AbortSignal) => {
		let message = this.messagesCache.get(id);

		if (!message) {
			message = await this.api.messages.getMessage(id, abortSingal);
			this.messagesCache.set(id, message);
		}

		return message;
	};

	@action
	public keepLoading = (direction: 'next' | 'previous') => {
		if (
			this.messagesStore.filterStore.filter.streams.length === 0 ||
			!this.searchChannelNext ||
			!this.searchChannelPrev ||
			(!this.prevLoadEndTimestamp && !this.nextLoadEndTimestamp)
		)
			return;

		const queryParams = this.messagesStore.filterStore.filterParams;

		const { stream, endTimestamp, resultCountLimit, resumeFromId } = queryParams;

		const query: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp:
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						direction === 'previous' ? this.prevLoadEndTimestamp! : this.nextLoadEndTimestamp!,
					stream,
					searchDirection: direction,
					endTimestamp,
					resultCountLimit,
					resumeFromId,
			  }
			: {
					...queryParams,
					startTimestamp:
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						direction === 'previous' ? this.prevLoadEndTimestamp! : this.nextLoadEndTimestamp!,
					searchDirection: direction,
			  };

		if (direction === 'previous') {
			this.noMatchingMessagesPrev = false;
			this.createPreviousMessageChannelEventSource({
				...query,
				resumeFromId: this.messages[this.messages.length - 1]?.messageId,
			});
			this.searchChannelPrev.subscribe();
		} else {
			this.noMatchingMessagesNext = false;
			this.createNextMessageChannelEventSource({
				...query,
				resumeFromId: this.messages[0]?.messageId,
			});
			this.searchChannelNext.subscribe();
		}
	};

	@action
	public matchMessage = async (messageId: string, abortSignal: AbortSignal) => {
		if (this.isSoftFiltered.get(messageId) !== undefined) return;
		this.isMatchingMessages.set(messageId, true);

		try {
			const {
				resultCountLimit,
				resumeFromId,
				searchDirection,
				...filterParams
			} = this.messagesStore.filterStore.filterParams;
			const isMatch = await this.api.messages.matchMessage(messageId, filterParams, abortSignal);

			runInAction(() => {
				this.isSoftFiltered.set(messageId, isMatch);
				this.isMatchingMessages.set(messageId, false);
			});
		} catch (error) {
			runInAction(() => {
				if (error.name !== 'AbortError') {
					this.isSoftFiltered.set(messageId, false);
				}
				this.isMatchingMessages.set(messageId, false);
			});
		}
	};
}
//
//
//
//
//
//
interface Props {
	computeItemKey?: (idx: number) => React.Key;
	rowCount: number;
	itemRenderer: (index: number, message: EventMessage) => React.ReactElement;
	/*
		 Number objects is used here because in some cases (eg one message / action was
		 selected several times by different entities)
		 We can't understand that we need to scroll to the selected entity again when
		 we are comparing primitive numbers.
		 Objects and reference comparison is the only way to handle numbers changing in this case.
	 */
	scrolledIndex: Number | null;
	className?: string;
	overscan?: number;
	messagesDataStore: EmbeddedMessagesDataProviderStore;
	messagesStore: EmbeddedMessagesStore;
	loadNextMessages: (resumeFromId?: string) => Promise<EventMessage[]>;
	loadPrevMessages: (resumeFromId?: string) => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = (props: Props) => {
	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const {
		className,
		overscan = 3,
		itemRenderer,
		loadPrevMessages,
		loadNextMessages,
		scrolledIndex,
		messagesStore,
		messagesDataStore,
	} = props;

	React.useEffect(() => {
		if (scrolledIndex !== null) {
			raf(() => {
				virtuoso.current?.scrollToIndex({ index: scrolledIndex.valueOf(), align: 'center' });
			}, 3);
		}
	}, [scrolledIndex]);

	const debouncedScrollHandler = useDebouncedCallback(
		(event: React.UIEvent<'div'>, wheelScrollDirection?: 'next' | 'previous') => {
			const scroller = event.target;
			if (scroller instanceof Element) {
				const isStartReached = scroller.scrollTop === 0;
				const isEndReached = scroller.scrollHeight - scroller.scrollTop === scroller.clientHeight;
				if (
					isStartReached &&
					messagesDataStore.searchChannelNext &&
					!messagesDataStore.searchChannelNext.isLoading &&
					!messagesDataStore.searchChannelNext.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'next')
				) {
					loadNextMessages(messagesDataStore.messages[0]?.messageId).then(messages =>
						messagesStore.dataStore.onNextChannelResponse(messages),
					);
				}

				if (
					isEndReached &&
					messagesDataStore.searchChannelPrev &&
					!messagesDataStore.searchChannelPrev.isLoading &&
					!messagesDataStore.searchChannelPrev.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'previous')
				) {
					loadPrevMessages(
						messagesDataStore.messages[messagesDataStore.messages.length - 1]?.messageId,
					).then(messages => messagesStore.dataStore.onPrevChannelResponse(messages));
				}
			}
		},
		100,
	);

	const onScroll = (event: React.UIEvent<'div'>) => {
		event.persist();
		debouncedScrollHandler(event);
	};

	const onWheel: React.WheelEventHandler<'div'> = event => {
		event.persist();
		debouncedScrollHandler(event, event.deltaY < 0 ? 'next' : 'previous');
	};

	return (
		<Virtuoso
			data={messagesDataStore.messages}
			firstItemIndex={messagesDataStore.startIndex}
			initialTopMostItemIndex={messagesDataStore.initialItemCount}
			ref={virtuoso}
			overscan={overscan}
			itemContent={itemRenderer}
			style={{ height: '100%', width: '100%' }}
			className={className}
			itemsRendered={messages => {
				messagesStore.currentMessagesIndexesRange = {
					startIndex: (messages && messages[0]?.originalIndex) ?? 0,
					endIndex: (messages && messages[messages.length - 1]?.originalIndex) ?? 0,
				};
			}}
			onScroll={onScroll}
			onWheel={onWheel}
			components={{
				Header: function MessagesListSpinnerNext() {
					return (
						<Observer>
							{() =>
								messagesDataStore.noMatchingMessagesNext ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment.utc(messagesStore.filterStore.filterParams.startTimestamp).format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesDataStore.keepLoading('next')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner isLoading={messagesDataStore.isLoadingNextMessages} />
								)
							}
						</Observer>
					);
				},
				Footer: function MessagesListSpinnerPrevious() {
					return (
						<Observer>
							{() =>
								messagesDataStore.noMatchingMessagesPrev ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment(messagesStore.filterStore.filterParams.startTimestamp).utc().format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesDataStore.keepLoading('previous')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner isLoading={messagesDataStore.isLoadingPreviousMessages} />
								)
							}
						</Observer>
					);
				},
			}}
		/>
	);
};

export { MessagesVirtualizedList };

interface SpinnerProps {
	isLoading: boolean;
}
const MessagesListSpinner = ({ isLoading }: SpinnerProps) => {
	if (!isLoading) return null;
	return <div className='messages-list__spinner' />;
};
//
//
//
//
//
//
function EmbeddedMessagePanel() {
	const envName =
		process.env.NODE_ENV === 'development'
			? 'development'
			: `${window.location.host}${window.location.pathname}`;
	const index = new IndexedDB(envName);
	const sessionsStore = new SessionsStore(index);
	const searchStore = new EmbeddedSearchStore(api, sessionsStore);
	const filtersHistoryStore = new FiltersHistoryStore(index, notificationsStore);
	const messagesStore = new EmbeddedMessagesStore(
		filtersHistoryStore,
		searchStore,
		api,
		sessionsStore,
	);

	const searchParams = new URLSearchParams(window.location.search);
	const sessions: string[] = [];
	const session = searchParams.get('session');

	const [viewType, setViewType] = useState(MessageViewType.JSON);
	const [fetchedMessages, setFetchedMessages] = useState<EventMessage[]>([]);
	const [customFilter, setCustomFilter] = useState<string | null>();
	const [filteredMessages, setFilteredMessages] = useState<EventMessage[] | null>();

	useEffect(() => {
		getMessages();
		filterMessages();
	}, []);

	const getMessages = async () => {
		await messagesStore.dataStore.loadMessages();
	};

	function filterMessages() {
		setFetchedMessages(messagesStore.dataStore.messages.slice());
		console.log(messagesStore.dataStore.messages.slice());
		searchParams.forEach(param => {
			switch (param) {
				case 'body':
					setCustomFilter(searchParams.get('body'));
					setFilteredMessages(
						fetchedMessages.filter(
							message => message.sessionId === sessions[0] && message.body === customFilter,
						),
					);
					break;
				case 'bodyBinary':
					setCustomFilter(searchParams.get('bodyBinary'));
					setFilteredMessages(
						fetchedMessages.filter(
							message => message.sessionId === sessions[0] && message.bodyBase64 === customFilter,
						),
					);
					break;
				case 'Type':
					setCustomFilter(searchParams.get('Type'));
					setFilteredMessages(
						fetchedMessages.filter(
							message => message.sessionId === sessions[0] && message.type === customFilter,
						),
					);
					break;
				// case 'attachedEventIds':
				// 	setCustomFilter(searchParams.get('attachedEventIds'));
				// setFilteredMessages(
				// 	fetchedMessages.filter(
				// 		message => message.sessionId === session && message. === customFilter,
				// 	),
				// );
				// break;
			}
		});
	}

	if (filteredMessages) {
		return (
			<div className='embedded-wrapper'>
				{Array.isArray(filteredMessages) ? (
					filteredMessages.map((message, index) => (
						<MessageCardBase
							key={`body-${session}-${index}`}
							isEmbedded
							message={message}
							setViewType={setViewType}
							viewType={viewType}
						/>
					))
				) : (
					<MessageCardBase
						key={session}
						isEmbedded
						message={filteredMessages}
						setViewType={setViewType}
						viewType={viewType}
					/>
				)}
			</div>
		);
	}
	return <SplashScreen />;
}

export default EmbeddedMessagePanel;
