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

import { action, computed, IReactionDisposer, observable, reaction, toJS } from 'mobx';
import { IFilterConfigStore } from 'models/Stores';
import moment from 'moment';
import { EventsFiltersInfo, EventFilterKeys } from 'api/sse';
import { getObjectKeys } from 'helpers/object';
import { TimeRange } from 'models/Timestamp';
import EventsFilter from 'models/filter/EventsFilter';
import { EventStoreURLState } from './EventsStore';

function getDefaultTimeRange(interval = 15): TimeRange {
	const timestampTo = moment.utc().valueOf();
	const timestampFrom = moment.utc(timestampTo).subtract(interval, 'minutes').valueOf();

	return [timestampFrom, timestampTo];
}

// temporary workaround. search store currently doesnt store filter type
function getFilterFromInitialState(eventsFilter: Partial<EventsFilter> | null) {
	if (!eventsFilter) return null;

	return getObjectKeys(eventsFilter).reduce((filterWithTypes, currentFilter) => {
		const filter = eventsFilter[currentFilter];
		if (!filter) return filterWithTypes;
		return {
			...filterWithTypes,
			[currentFilter]: {
				...filter,
				type:
					currentFilter === 'status'
						? 'switcher'
						: typeof filter.values === 'string'
						? 'string'
						: 'string[]',
			},
		};
	}, {} as EventsFilter);
}

export type EventsFilterStoreInitialState = Pick<EventStoreURLState, 'filter' | 'range'>;

export default class EventsFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	private sseFilterInfoSubscription: IReactionDisposer;

	constructor(
		private filterConfigStore: IFilterConfigStore,
		initialState?: EventsFilterStoreInitialState,
	) {
		const [startTimestamp, endTimestamp] = initialState?.range || getDefaultTimeRange();

		if (initialState) {
			const { filter } = initialState;

			const defaultEventFilter = toJS(this.filterConfigStore.eventFilters);
			this.setEventsFilter(
				filter
					? {
							...((defaultEventFilter || {}) as EventsFilter),
							...getFilterFromInitialState(filter),
					  }
					: defaultEventFilter,
			);
		}

		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;

		this.sseFilterSubscription = reaction(
			() => this.filterConfigStore.eventFilters as unknown as EventsFilter,
			this.initSSEFilter,
			{ fireImmediately: true },
		);

		this.sseFilterInfoSubscription = reaction(
			() => this.filterConfigStore.eventFilterInfo,
			filterInfo => (this.filterInfo = filterInfo),
			{ fireImmediately: true },
		);
	}

	@observable
	public interval = 15;

	@observable
	public isOpen = false;

	@observable
	public startTimestamp: number;

	@observable
	public endTimestamp: number;

	@action
	public setStartTimestamp = (timestamp: number) => {
		this.startTimestamp = timestamp;
	};

	@action
	public setEndTimestamp = (timestamp: number) => {
		this.endTimestamp = timestamp;
	};

	@computed
	public get range(): TimeRange {
		return [this.startTimestamp, this.endTimestamp];
	}

	@computed
	public get rangeCenter(): number {
		const [from, to] = this.range;
		return Math.floor(from + (to - from) / 2);
	}

	@observable
	public filter: null | EventsFilter = toJS(this.filterConfigStore.eventFilters as EventsFilter);

	@computed
	public get isFilterApplied(): boolean {
		if (!this.filter) return false;
		return getObjectKeys(this.filter).some((filterName: EventFilterKeys) => {
			if (filterName === 'status') {
				return this.filter && this.filter[filterName].values !== 'All';
			}
			return this.filter !== null && this.filter[filterName].values.length > 0;
		});
	}

	@computed
	public get isValid() {
		return this.endTimestamp > this.startTimestamp;
	}

	@action
	public setInterval = (interval: number) => {
		this.interval = interval;
	};

	@action
	public setRange = ([startTimestamp, endTimestamp]: TimeRange) => {
		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;
	};

	@action
	public setEventsFilter = (filter: EventsFilter | null) => {
		this.filter = filter;
	};

	@action
	public getDefaultEventFilter = (): EventsFilter | null =>
		toJS(this.filterConfigStore.eventFilters);

	@action
	public setIsOpen = (state: boolean) => {
		this.isOpen = state;
	};

	@observable.ref
	public filterInfo: EventsFiltersInfo[] = [];

	@action
	private initSSEFilter = (filterConfig: EventsFilter | null) => {
		if (this.filter) {
			this.filter = {
				...(toJS(filterConfig) || {}),
				...this.filter,
			};
		} else {
			this.filter = toJS(filterConfig);
		}
	};

	@action
	public clearFilter = () => {
		const defaultFilter = this.getDefaultEventFilter();
		this.filter = defaultFilter;
	};

	public dispose = () => {
		this.sseFilterSubscription();
		this.sseFilterInfoSubscription();
	};
}
