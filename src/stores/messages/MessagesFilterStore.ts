/** *****************************************************************************
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

import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import MessagesFilter from '../../models/filter/MessagesFilter';
import { MessageFilterState } from '../../components/search-panel/SearchPanelFilters';
import { SearchStore } from '../SearchStore';
import { getDefaultMessagesFiltersState } from '../../helpers/search';
import { MessagesFilterInfo, MessagesSSEParams } from '../../api/sse';
import notificationsStore from '../NotificationsStore';

function getDefaultMessagesFilter(): MessagesFilter {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

export type MessagesFilterStoreInitialState = {
	sse?: Partial<MessageFilterState> | null;
	isSoftFilter?: boolean;
} & Partial<MessagesFilter>;

export default class MessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(private searchStore: SearchStore, initialState?: MessagesFilterStoreInitialState) {
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
			...Object.fromEntries(
				[...filterValues, ...filterInclusion, ...filterConjunct].filter(
					filtersArr => filtersArr.length,
				),
			),
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
		};
	}

	@computed
	public get isMessagesFilterApplied() {
		if (!this.sseMessagesFilter) return false;
		return Object.values(this.sseMessagesFilter).some(filter => filter.values.length > 0);
	}

	public SESSIONS_LIMIT = 5;

	@action
	public setMessagesFilter(
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null = null,
		isSoftFilterApplied: boolean,
	) {
		this.isSoftFilter = isSoftFilterApplied;
		this.sseMessagesFilter = sseFilters;

		if (filter.streams.length > this.SESSIONS_LIMIT)
			notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'error',
				header: `Sessions limit of ${this.SESSIONS_LIMIT} reached.`,
				description: `Sessions not included in current sessions: ${filter.streams
					.slice(this.SESSIONS_LIMIT)
					.join(', ')}.`,
				id: nanoid(),
			});

		this.filter = {
			...filter,
			streams: filter.streams.slice(0, this.SESSIONS_LIMIT),
		};
	}

	@action
	public resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = getDefaultMessagesFiltersState(this.searchStore.messagesFilterInfo);
		const defaultMessagesFilter = getDefaultMessagesFilter();
		this.sseMessagesFilter = filter;
		this.isSoftFilter = false;
		this.filter = {
			...defaultMessagesFilter,
			timestampFrom: this.filter.timestampFrom,
			timestampTo: this.filter.timestampTo,
			...initFilter,
		};
	};

	public init = (initialState?: MessagesFilterStoreInitialState) => {
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
