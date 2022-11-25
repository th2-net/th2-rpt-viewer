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
import { calculateTimeRange } from '../helpers/calculateTimeRange';

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

export type EventsFilterStoreInitialState = Partial<{
	range: TimeRange;
	filter: Partial<EventsFilter>;
}>;

export default class EventsFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	private sseFilterInfoSubscription: IReactionDisposer;

	constructor(
		private filterConfigStore: IFilterConfigStore,
		initialState?: EventsFilterStoreInitialState,
	) {
		if (initialState) {
			const defaultRange = getDefaultTimeRange();

			const { range = defaultRange, filter } = initialState;

			const defaultEventFilter = toJS(
				this.filterConfigStore.eventFilters,
			) as unknown as EventsFilter;
			this.setEventsFilter(
				filter
					? {
							...((defaultEventFilter || {}) as EventsFilter),
							...getFilterFromInitialState(filter),
					  }
					: defaultEventFilter,
			);
			this.setRange(range);
		}

		this.setTimestampFromRange(this.range);

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
	public timestamp: Number = new Number(
		moment
			.utc()
			.subtract(this.interval / 2, 'minutes')
			.valueOf(),
	);

	@observable
	public range: TimeRange = calculateTimeRange(
		moment.utc(this.timestamp.valueOf()).valueOf(),
		this.interval,
	);

	@observable
	public isOpen = false;

	@computed
	public get timestampFrom(): number {
		return this.range[0];
	}

	@computed
	public get timestampTo(): number {
		return this.range[1];
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

	@action
	public setInterval = (interval: number) => {
		this.interval = interval;
	};

	@action
	public setTimestamp = (timestamp: number) => {
		this.timestamp = new Number(timestamp);
	};

	@action
	public setRange = (range: TimeRange) => {
		this.range = range;
	};

	@action
	public setTimestampFromRange = (range: TimeRange) => {
		this.timestamp = new Number(range[0] + (range[1] - range[0]) / 2);
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

	public dispose = () => {
		this.sseFilterSubscription();
		this.sseFilterInfoSubscription();
	};
}