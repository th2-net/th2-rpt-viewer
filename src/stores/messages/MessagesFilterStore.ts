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

import { action, computed, IReactionDisposer, observable, reaction, toJS } from 'mobx';
import moment from 'moment';
import { IFilterConfigStore } from 'models/Stores';
import { MessageFilterState } from 'modules/search/models/Search';
import MessagesFilter from '../../models/filter/MessagesFilter';
import { MessagesSSEParams } from '../../api/sse';

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

	constructor(private filtersStore: IFilterConfigStore, initialState?: MessagesFilterStoreInitialState) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(() => filtersStore.messageFilters, this.initSSEFilter);
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

	@action
	public setMessagesFilter(
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	) {
		this.isSoftFilter = isSoftFilterApplied;
		this.sseMessagesFilter = sseFilters;
		this.filter = filter;
	}

	@action
	public resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = toJS(this.filtersStore.messageFilters);
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
				...toJS(this.filtersStore.messageFilters || {}),
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
			this.setDefaultSSEFilter();
		}
	};

	@action
	private setDefaultSSEFilter = () => {
		this.sseMessagesFilter = toJS(this.filtersStore.messageFilters);
	};

	@action
	private initSSEFilter = (filters: MessageFilterState | null) => {
		const filtersCopy = toJS(filters);

		if (filtersCopy) {
			this.sseMessagesFilter = {
				...filtersCopy,
				...(this.sseMessagesFilter || {}),
			};
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
