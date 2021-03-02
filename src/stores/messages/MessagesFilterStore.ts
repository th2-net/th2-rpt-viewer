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
import MessagesFilter from '../../models/filter/MessagesFilter';
import { MessageFilterState } from '../../components/search-panel/SearchPanelFilters';
import { SearchStore } from '../SearchStore';
import { getDefaultFilterState } from '../../helpers/search';
import { MessagesSSEParams, SSEFilterInfo } from '../../api/sse';
import { EventSourceConfig } from '../../api/ApiSchema';

function getDefaultMessagesFilter(): MessagesFilter {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

export type MessagesFilterStoreInitialState = Partial<MessagesFilter>;

export default class MessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(private searchStore: SearchStore, initialState?: MessagesFilterStoreInitialState) {
		if (initialState) {
			const { streams, timestampTo, timestampFrom } = initialState;
			const defaultMessagesFilter = getDefaultMessagesFilter();

			this.setMessagesFilter({
				streams: streams || defaultMessagesFilter.streams,
				timestampTo: timestampTo || defaultMessagesFilter.timestampTo,
				timestampFrom: timestampFrom || defaultMessagesFilter.timestampFrom,
			});
		}

		this.setSSEMessagesFilter(this.searchStore.messagesFilterInfo);

		this.sseFilterSubscription = reaction(
			() => searchStore.messagesFilterInfo,
			this.setSSEMessagesFilter,
		);
	}

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	@observable sseMessagesFilter: MessageFilterState | null = null;

	@computed
	public get messsagesSSEConfig(): EventSourceConfig {
		const sseFilters = this.sseMessagesFilter;

		const filtersToAdd: Array<keyof MessageFilterState> = !sseFilters
			? []
			: Object.entries(sseFilters)
					.filter(filter => filter[1].values.length > 0)
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

		const endTimestamp = moment().utc().subtract(30, 'minutes').valueOf();
		const startTimestamp = moment(endTimestamp).add(5, 'minutes').valueOf();

		const queryParams: MessagesSSEParams = {
			startTimestamp: this.filter.timestampTo || startTimestamp,
			stream: this.filter.streams,
			searchDirection: 'previous',
			resultCountLimit: 15,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion]),
		};

		return {
			type: 'message',
			queryParams,
		};
	}

	@computed
	public get isMessagesFilterApplied() {
		return [
			this.filter.streams,
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
	setMessagesFilter(filter: MessagesFilter, sseFilters: MessageFilterState | null = null) {
		this.sseMessagesFilter = sseFilters;
		this.filter = filter;
	}

	@action
	resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = getDefaultFilterState(this.searchStore.messagesFilterInfo);
		const defaultMessagesFilter = getDefaultMessagesFilter();
		this.sseMessagesFilter = Object.keys(filter).length ? (filter as MessageFilterState) : null;
		this.filter = {
			...defaultMessagesFilter,
			...initFilter,
		};
	};

	@action
	private setSSEMessagesFilter = (messagesFilterInfo: SSEFilterInfo[]) => {
		const filter = getDefaultFilterState(messagesFilterInfo);

		if (Object.keys(filter).length > 0) {
			this.sseMessagesFilter = filter as MessageFilterState;
		} else {
			this.sseMessagesFilter = null;
		}
	};

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
