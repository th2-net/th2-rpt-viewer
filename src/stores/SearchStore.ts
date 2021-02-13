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
import { SSEFilterInfo, SSEParams } from '../api/sse';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { getTimestampAsNumber } from '../helpers/date';
import { isEventNode } from '../helpers/event';
import { getDefaultFilterState } from '../helpers/search';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import localStorageWorker from '../util/LocalStorageWorker';
import notificationsStore from './NotificationsStore';
import WorkspacesStore from './workspace/WorkspacesStore';

export type SearchPanelFormState = {
	startTimestamp: number;
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

export class SearchStore {
	constructor(private workspacesStore: WorkspacesStore, private api: ApiSchema) {
		this.getEventFilters();
		this.getMessagesFilters();

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

	@observable searchChannel: EventSource | null = null;

	@observable eventsFilter: EventFilterState | null = null;

	@observable messagesFilter: MessageFilterState | null = null;

	@observable searchForm: SearchPanelFormState = {
		startTimestamp: this.workspacesStore.activeWorkspace.graphDataStore.range[0],
		searchDirection: 'next',
		resultCountLimit: 50,
		endTimestamp: null,
		parentEvent: '',
		stream: [],
	};

	@observable formType: SearchPanelType = 'event';

	@observable searchHistory: SearchHistory[] = localStorageWorker.getSearchHistory();

	@observable currentIndex = this.searchHistory.length > 0 ? this.searchHistory.length - 1 : 0;

	@observable eventFilterInfo: SSEFilterInfo[] = [];

	@observable messagesFilterInfo: SSEFilterInfo[] = [];

	@computed get searchProgress() {
		const lastItem = this.currentSearch?.results[this.currentSearch.results.length - 1];
		const lastItemTimestamp = lastItem
			? getTimestampAsNumber(isEventNode(lastItem) ? lastItem.startTimestamp : lastItem.timestamp)
			: null;
		return {
			startTimestamp: this.searchForm.startTimestamp,
			endTimestamp: this.searchForm.endTimestamp,
			currentPoint: lastItemTimestamp ? lastItemTimestamp - this.searchForm.startTimestamp : 0,
			searching: Boolean(this.searchChannel),
		};
	}

	@observable currentSearch: SearchHistory | null = null;

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

	@action
	getEventFilters = async () => {
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

	@action
	getMessagesFilters = async () => {
		try {
			const filters = await this.api.sse.getFilters('messages');
			const filtersInfo = await this.api.sse.getFiltersInfo('messages', filters);
			runInAction(() => {
				this.messagesFilterInfo = filtersInfo;
				this.messagesFilter = getDefaultFilterState(filtersInfo) as MessageFilterState;
			});
		} catch (error) {
			console.error('Error occured while loading messages filters', error);
		}
	};

	@action toggleFormType = () => {
		this.formType = this.formType === 'event' ? 'message' : 'event';
	};

	@action updateForm = (stateUpdate: Partial<SearchPanelFormState>) => {
		this.searchForm = {
			...this.searchForm,
			...stateUpdate,
		};
	};

	@action setEventsFilter = (patch: Partial<EventFilterState>) => {
		if (this.eventsFilter) {
			this.eventsFilter = {
				...this.eventsFilter,
				...patch,
			};
		}
	};

	@action setMessagesFilter = (patch: Partial<MessageFilterState>) => {
		if (this.messagesFilter) {
			this.messagesFilter = {
				...this.messagesFilter,
				...patch,
			};
		}
	};

	@action deleteHistoryItem = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = this.searchHistory.filter(item => item !== searchHistoryItem);
		if (!this.searchHistory[this.currentIndex] && this.searchHistory.length > 0) {
			this.currentIndex = this.searchHistory.length - 1;
		} else {
			this.currentIndex = 0;
		}

		localStorageWorker.saveSearchHistory(this.searchHistory);
	};

	@action nextSearch = () => {
		if (this.currentIndex < this.searchHistory.length - 1) {
			this.currentIndex += 1;
		}
	};

	@action prevSearch = () => {
		if (this.currentIndex !== 0) {
			this.currentIndex -= 1;
		}
	};

	@action newSearch = (searchHistoryItem: SearchHistory) => {
		this.searchHistory = [...this.searchHistory, searchHistoryItem];
		this.currentIndex = this.searchHistory.length - 1;
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

	@action startSearch = () => {
		if (this.searchChannel) return;

		const filterParams = this.formType === 'event' ? this.eventsFilter : this.messagesFilter;

		this.newSearch({
			timestamp: moment().utc().valueOf(),
			request: { type: this.formType, state: this.searchForm, filters: filterParams! },
			results: [],
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
		this.searchChannel.addEventListener('close', this.stopSearch);
		this.searchChannel.addEventListener('error', this.onError);
	};

	@action
	stopSearch = () => {
		if (!this.searchChannel) return;
		this.searchChannel?.close();
		this.searchChannel = null;

		localStorageWorker.saveSearchHistory(this.searchHistory);
	};

	@action
	onError = (ev: Event) => {
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
			this.currentSearch.results = [...this.currentSearch.results, JSON.parse(data)];
		}
	};
}
