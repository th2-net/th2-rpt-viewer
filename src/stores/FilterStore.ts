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

import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import moment from 'moment';
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';
import { MessageFilterState } from '../components/search-panel/SearchPanelFilters';
import { SearchStore } from './SearchStore';
import { getDefaultFilterState } from '../helpers/search';
import { MessagesSSEParams } from '../api/sse';
import { EventSourceConfig } from '../api/ApiSchema';

export const defaultMessagesFilter: MessagesFilter = {
	timestampFrom: null,
	timestampTo: moment(Date.now()).utc().valueOf(),
	streams: [],
	messageTypes: [],
};

export function getDefaultEventFilter() {
	const timestampTo = moment(Date.now()).utc().valueOf();
	const timestampFrom = moment(timestampTo).utc().subtract(15, 'minutes').valueOf();

	return {
		timestampTo,
		timestampFrom,
		eventTypes: [],
		names: [],
	};
}

type InitialState = Partial<{
	messagesFilter: MessagesFilter;
	eventsFilter: EventsFilter;
}>;

export default class FilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(private searchStore: SearchStore, initialState?: InitialState) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(
			() => searchStore.messagesFilterInfo,
			filterInfo => {
				const filter = getDefaultFilterState(filterInfo);

				if (Object.keys(filter).length > 0) {
					this.sseMessagesFilter = filter as MessageFilterState;
				} else {
					this.sseMessagesFilter = null;
				}
			},
		);
	}

	@observable messagesFilter: MessagesFilter = defaultMessagesFilter;

	@observable sseMessagesFilter: MessageFilterState | null = null;

	@observable eventsFilter: EventsFilter = getDefaultEventFilter();

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
			startTimestamp: this.messagesFilter.timestampTo || startTimestamp,
			stream: this.messagesFilter.streams,
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
	public get isEventsFilterApplied() {
		return this.eventsFilter.eventTypes.length > 0 || this.eventsFilter.names.length > 0;
	}

	@computed
	public get isMessagesFilterApplied() {
		return [
			this.messagesFilter.streams,
			this.messagesFilter.messageTypes,
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
	setMessagesFilter(filter: MessagesFilter, sseFilters: MessageFilterState | null) {
		this.sseMessagesFilter = sseFilters;
		this.messagesFilter = filter;
	}

	@action
	resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = getDefaultFilterState(this.searchStore.messagesFilterInfo);
		this.sseMessagesFilter = Object.keys(filter).length ? (filter as MessageFilterState) : null;
		this.messagesFilter = {
			...defaultMessagesFilter,
			...initFilter,
		};
	};

	@action
	setEventsFilter(filter?: EventsFilter) {
		if (!filter) {
			this.resetEventsFilter();
			return;
		}
		this.eventsFilter = filter;
	}

	@action
	resetEventsFilter() {
		this.eventsFilter = getDefaultEventFilter();
	}

	@action
	private init(initialState?: InitialState) {
		if (!initialState) return;

		const {
			eventsFilter = getDefaultEventFilter(),
			messagesFilter = defaultMessagesFilter,
		} = initialState;

		this.eventsFilter = {
			names: eventsFilter.names || eventsFilter.names,
			eventTypes: eventsFilter.eventTypes || eventsFilter.eventTypes,
			timestampTo: eventsFilter.timestampTo || eventsFilter.timestampTo,
			timestampFrom: eventsFilter.timestampFrom || eventsFilter.timestampFrom,
		};

		this.messagesFilter = {
			messageTypes: messagesFilter.messageTypes || defaultMessagesFilter.messageTypes,
			streams: messagesFilter.streams || defaultMessagesFilter.streams,
			timestampTo: messagesFilter.timestampTo || defaultMessagesFilter.timestampTo,
			timestampFrom: messagesFilter.timestampFrom || defaultMessagesFilter.timestampFrom,
		};
	}

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
