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

import { action, autorun, computed, observable, reaction, runInAction, makeObservable } from 'mobx';
import moment from 'moment';
import ApiSchema from 'api/ApiSchema';
import { SSEFilterInfo, SSEHeartbeat, SSEParams } from 'api/sse';
import { SearchPanelType } from 'components/search-panel/SearchPanel';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from 'components/search-panel/SearchPanelFilters';
import { getTimestampAsNumber, timestampToNumber } from 'helpers/date';
import { isEventMessage, isEventNode } from 'helpers/event';
import { getDefaultFilterState } from 'helpers/search';
import { EventTreeNode } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import localStorageWorker from 'util/LocalStorageWorker';
import notificationsStore from './NotificationsStore';

export type SearchPanelFormState = {
	startTimestamp: number | null;
	endTimestamp: number | null;
	resultCountLimit: number;
	searchDirection: 'next' | 'previous';
	parentEvent: string;
	stream: string[];
};

export type SearchResult = EventTreeNode | EventMessage;

export type SearchHistory = {
	timestamp: number;
	results: Array<SearchResult>;
	request: StateHistory;
	progress: number;
	processedObjectCount: number;
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

interface SearchProgress {
	startTimestamp: number | null;
	endTimestamp: number | null;
	currentPoint: number;
	searching: boolean;
	searchDirection: 'next' | 'previous';
	completed: boolean;
	processedObjectCount: number;
}

type SearchFilters =
	| {
			info: SSEFilterInfo[];
			state: EventFilterState;
			setState: (patch: Partial<EventFilterState>) => void;
			disableAll: boolean;
	  }
	| {
			info: SSEFilterInfo[];
			state: MessageFilterState;
			setState: (patch: Partial<MessageFilterState>) => void;
			disableAll: boolean;
	  }
	| null;

export class SearchStore {
	constructor(private api: ApiSchema) {
		makeObservable<SearchStore, 'loadMessageSessions'>(this, {
			messageSessions: observable,
			searchChannel: observable,
			eventsFilter: observable,
			messagesFilter: observable,
			searchForm: observable,
			formType: observable,
			searchHistory: observable,
			currentIndex: observable,
			eventFilterInfo: observable,
			messagesFilterInfo: observable,
			isMessageFiltersLoading: observable,
			searchProgress: computed,
			isSearching: computed,
			currentSearch: observable,
			completed: observable,
			isFormDisabled: computed,
			filters: computed,
			getEventFilters: action,
			getMessagesFilters: action,
			toggleFormType: action,
			updateForm: action,
			setEventsFilter: action,
			setMessagesFilter: action,
			deleteHistoryItem: action,
			nextSearch: action,
			prevSearch: action,
			newSearch: action,
			updateSearchItem: action,
			startSearch: action,
			stopSearch: action,
			resultGroups: computed,
			loadMessageSessions: action,
		});

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

	public messageSessions: Array<string> = [];

	public searchChannel: EventSource | null = null;

	public eventsFilter: EventFilterState | null = null;

	public messagesFilter: MessageFilterState | null = null;

	public searchForm: SearchPanelFormState = {
		startTimestamp: moment().utc().subtract(30, 'minutes').valueOf(),
		searchDirection: 'next',
		resultCountLimit: 50,
		endTimestamp: null,
		parentEvent: '',
		stream: [],
	};

	public formType: SearchPanelType = 'event';

	public searchHistory: SearchHistory[] = localStorageWorker.getSearchHistory();

	public currentIndex = this.searchHistory.length > 0 ? this.searchHistory.length - 1 : 0;

	public eventFilterInfo: SSEFilterInfo[] = [];

	public messagesFilterInfo: SSEFilterInfo[] = [];

	public isMessageFiltersLoading = false;

	public get searchProgress(): SearchProgress {
		return {
			startTimestamp: this.searchForm.startTimestamp,
			endTimestamp: this.searchForm.endTimestamp,
			currentPoint: this.currentSearch?.progress
				? this.currentSearch?.progress - Number(this.searchForm.startTimestamp)
				: 0,
			searchDirection: this.searchForm.searchDirection,
			searching: Boolean(this.searchChannel),
			completed: this.completed,
			processedObjectCount: this.currentSearch?.processedObjectCount || 0,
		};
	}

	public get isSearching(): boolean {
		return Boolean(this.searchChannel);
	}

	public currentSearch: SearchHistory | null = null;

	public completed = this.searchHistory.length > 0;

	public get isFormDisabled(): boolean {
		return this.searchHistory.length > 1 && this.currentIndex !== this.searchHistory.length - 1;
	}

	public get filters(): SearchFilters {
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

	public getEventFilters = async (): Promise<void> => {
		try {
			const filters = await this.api.sse.getFilters('events');
			const filtersInfo = await this.api.sse.getFiltersInfo('events', filters);
			runInAction(() => {
				this.eventFilterInfo = filtersInfo;
				this.eventsFilter = getDefaultFilterState(filtersInfo) as EventFilterState;
			});
		} catch (error) {
			console.error('Error occured while loading event filters', error);
		}
	};

	public getMessagesFilters = async (): Promise<void> => {
		this.isMessageFiltersLoading = true;
		try {
			const filters = await this.api.sse.getFilters('messages');
			const filtersInfo = await this.api.sse.getFiltersInfo('messages', filters);
			runInAction(() => {
				this.messagesFilterInfo = filtersInfo;
				this.messagesFilter = getDefaultFilterState(filtersInfo) as MessageFilterState;
			});
		} catch (error) {
			console.error('Error occured while loading messages filters', error);
		} finally {
			this.isMessageFiltersLoading = false;
		}
	};

	public toggleFormType = (): void => {
		this.formType = this.formType === 'event' ? 'message' : 'event';
	};

	public updateForm = (stateUpdate: Partial<SearchPanelFormState>): void => {
		this.searchForm = {
			...this.searchForm,
			...stateUpdate,
		};
		this.completed = false;
	};

	public setEventsFilter = (patch: Partial<EventFilterState>): void => {
		if (this.eventsFilter) {
			this.eventsFilter = {
				...this.eventsFilter,
				...patch,
			};
		}

		this.completed = false;
	};

	public setMessagesFilter = (patch: Partial<MessageFilterState>): void => {
		if (this.messagesFilter) {
			this.messagesFilter = {
				...this.messagesFilter,
				...patch,
			};
		}

		this.completed = false;
	};

	public deleteHistoryItem = (searchHistoryItem: SearchHistory): void => {
		this.searchHistory = this.searchHistory.filter(item => item !== searchHistoryItem);
		this.currentIndex = Math.max(this.currentIndex - 1, 0);

		if (this.searchHistory.length === 0) {
			this.completed = false;
		}

		localStorageWorker.saveSearchHistory(this.searchHistory);
	};

	public nextSearch = (): void => {
		if (this.currentIndex < this.searchHistory.length - 1) {
			this.currentIndex += 1;
			this.completed = true;
		}
	};

	public prevSearch = (): void => {
		if (this.currentIndex !== 0) {
			this.currentIndex -= 1;
			this.completed = true;
		}
	};

	public newSearch = (searchHistoryItem: SearchHistory): void => {
		this.searchHistory = [...this.searchHistory, searchHistoryItem];
		this.currentIndex = this.searchHistory.length - 1;
	};

	public updateSearchItem = (searchHistoryItem: Partial<SearchHistory>): void => {
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

	public startSearch = (): void => {
		this.completed = false;
		const filterParams = this.formType === 'event' ? this.eventsFilter : this.messagesFilter;
		if (this.searchChannel || !filterParams) return;

		this.newSearch({
			timestamp: moment().utc().valueOf(),
			request: { type: this.formType, state: this.searchForm, filters: filterParams },
			results: [],
			progress: 0,
			processedObjectCount: 0,
		});

		function getFilter<T extends keyof FilterState>(name: T) {
			return filterParams![name];
		}

		const {
			startTimestamp: _startTimestamp,
			searchDirection,
			resultCountLimit,
			endTimestamp,
			parentEvent,
			stream,
		} = this.searchForm;

		const filtersToAdd = !this.filters
			? []
			: this.filters.info
					.filter((info: SSEFilterInfo) => getFilter(info.name).values.length !== 0)
					.map((info: SSEFilterInfo) => info.name);

		const filterValues = filtersToAdd.map(filter => [`${filter}-values`, getFilter(filter).values]);

		const filterInclusion = filtersToAdd.map(filter =>
			getFilter(filter).negative ? [`${filter}-negative`, getFilter(filter).negative] : [],
		);

		const params = {
			startTimestamp: _startTimestamp,
			searchDirection,
			resultCountLimit,
			endTimestamp,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion]),
		};

		const queryParams: SSEParams =
			this.formType === 'event' ? { ...params, parentEvent } : { ...params, stream };

		this.searchChannel = this.api.sse.getEventSource({
			type: this.formType,
			queryParams,
		});

		this.searchChannel.addEventListener(this.formType, this.onChannelResponse);
		this.searchChannel.addEventListener('keep_alive', this.onChannelResponse);
		this.searchChannel.addEventListener('close', this.stopSearch);
		this.searchChannel.addEventListener('error', this.onError);
	};

	public stopSearch = (): void => {
		if (!this.searchChannel) return;
		this.searchChannel.close();
		this.searchChannel = null;
		this.completed = true;

		localStorageWorker.saveSearchHistory(this.searchHistory);
	};

	public get resultGroups(): Array<Array<SearchResult>> {
		if (!this.currentSearch) return [];
		if (!this.currentSearch.results.length) return [];

		const groups: Array<Array<SearchResult>> = [[]];
		let groupStartTime = getTimestampAsNumber(this.currentSearch.results[0]);
		const searchDirection = this.currentSearch.request.state.searchDirection;

		this.currentSearch.results.forEach(result => {
			const resultTimestamp = getTimestampAsNumber(result);
			if (
				(searchDirection === 'next'
					? resultTimestamp - groupStartTime
					: groupStartTime - resultTimestamp) /
					1000 /
					60 <
				SEARCH_RESULT_GROUP_TIME_INTERVAL_MINUTES
			) {
				groups[groups.length - 1].push(result);
			} else {
				groupStartTime = getTimestampAsNumber(result);
				groups.push([]);
				groups[groups.length - 1].push(result);
			}
		});
		return groups;
	}

	private onError = (ev: Event) => {
		const data = (ev as MessageEvent).data;
		notificationsStore.addResponseError({
			type: 'error',
			header: JSON.parse(data).exceptionName,
			resource: (ev.target as EventSource).url,
			responseBody: JSON.parse(data).exceptionCause,
			responseCode: null,
		});

		this.stopSearch();
	};

	private onChannelResponse = (ev: Event) => {
		if (this.currentSearch) {
			const data = (ev as MessageEvent).data;
			const parsedEvent: SearchResult | SSEHeartbeat = JSON.parse(data);
			if (isEventNode(parsedEvent) || isEventMessage(parsedEvent)) {
				this.currentSearch.results = [...this.currentSearch.results, JSON.parse(data)];
			}
			if (isEventNode(parsedEvent)) {
				this.currentSearch.progress = timestampToNumber(parsedEvent.startTimestamp);
				return;
			}
			if (isEventMessage(parsedEvent)) {
				this.currentSearch.progress = timestampToNumber(parsedEvent.timestamp);
				return;
			}
			this.currentSearch.progress = parsedEvent.timestamp;
			this.currentSearch.processedObjectCount = parsedEvent.scanCounter;
		}
	};

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
}
