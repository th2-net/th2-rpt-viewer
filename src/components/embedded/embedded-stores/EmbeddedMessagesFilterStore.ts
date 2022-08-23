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

import { action, computed, IReactionDisposer, observable, reaction, runInAction } from 'mobx';
import moment from 'moment';
import MessagesFilter, { MessagesParams } from '../../../models/filter/MessagesFilter';
import { getDefaultMessagesFiltersState } from '../../../helpers/search';
import { MessagesFilterInfo, MessagesSSEParams } from '../../../api/sse';
import ApiSchema from '../../../api/ApiSchema';

function getDefaultMessagesParams(): MessagesParams {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

export type EmbeddedMessagesFilterInitialState = {
	timestampFrom: number | null;
	timestampTo: number | null;
	streams: string[];
	sse: MessagesFilter;
};

export default class EmbeddedMessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(private api: ApiSchema, initialState: EmbeddedMessagesFilterInitialState) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(() => this.messagesFilterInfo, this.initSSEFilter);
	}

	@observable filter: MessagesParams = getDefaultMessagesParams();

	@observable sseMessagesFilter: MessagesFilter | null = null;

	@observable isMessageFiltersLoading = false;

	@observable messagesFilterInfo: MessagesFilterInfo[] = [];

	@observable messagesFilter: MessagesFilter | null = null;

	@computed
	public get filterParams(): MessagesSSEParams {
		const sseFilters = this.sseMessagesFilter;

		const filtersToAdd: Array<keyof MessagesFilter> = !sseFilters
			? []
			: Object.entries(sseFilters)
					.filter(([_, filter]) => filter.values.length > 0)
					.map(([filterName]) => filterName as keyof MessagesFilter);

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
	public get isMessagesFilterApplied() {
		return [
			this.sseMessagesFilter?.attachedEventIds &&
			this.sseMessagesFilter?.body &&
			this.sseMessagesFilter?.type
				? [
						this.sseMessagesFilter.attachedEventIds.values,
						this.sseMessagesFilter.body.values,
						this.sseMessagesFilter.type.values,
				  ].flat()
				: [],
		].some(filter => filter.length > 0);
	}

	@action
	public setMessagesFilter(filter: MessagesParams, sseFilters: MessagesFilter | null = null) {
		this.sseMessagesFilter = sseFilters;
		this.filter = filter;
	}

	@action
	public resetMessagesFilter = (initFilter: Partial<MessagesParams> = {}) => {
		const filter = getDefaultMessagesFiltersState(this.messagesFilterInfo);
		const defaultMessagesFilter = getDefaultMessagesParams();
		this.sseMessagesFilter = filter;
		this.filter = {
			...defaultMessagesFilter,
			timestampFrom: this.filter.timestampFrom,
			timestampTo: this.filter.timestampTo,
			...initFilter,
		};
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

	private init = (initialState: EmbeddedMessagesFilterInitialState) => {
		this.getMessagesFilters();
		const defaultMessagesFilter = getDefaultMessagesParams();
		const {
			streams = defaultMessagesFilter.streams,
			timestampFrom = defaultMessagesFilter.timestampFrom,
			timestampTo = defaultMessagesFilter.timestampTo,
			sse = {},
		} = initialState;

		const appliedSSEFilter = {
			...(getDefaultMessagesFiltersState(this.messagesFilterInfo) || {}),
			...sse,
		} as MessagesFilter;
		this.setMessagesFilter(
			{
				streams,
				timestampFrom,
				timestampTo,
			},
			Object.keys(appliedSSEFilter).length > 0 ? appliedSSEFilter : null,
		);
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

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
