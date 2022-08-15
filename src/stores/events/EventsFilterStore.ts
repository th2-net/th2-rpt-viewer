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
import EventsFilter from '../../models/filter/EventsFilter';
import { GraphStore } from '../GraphStore';
import { SearchStore } from '../SearchStore';
import { EventsFiltersInfo, EventFilterKeys } from '../../api/sse';
import { getDefaultEventsFiltersState } from '../../helpers/search';
import { TimeRange } from '../../models/Timestamp';
import { getObjectKeys } from '../../helpers/object';

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

	constructor(
		private graphStore: GraphStore,
		private searchStore: SearchStore,
		initialState?: EventsFilterStoreInitialState,
	) {
		if (initialState) {
			const defaultRange = getDefaultTimeRange(this.graphStore.interval);

			const { range = defaultRange, filter } = initialState;

			const defaultEventFilter = getDefaultEventsFiltersState(this.searchStore.eventFilterInfo);
			this.setEventsFilter(
				filter
					? {
							...((defaultEventFilter || {}) as EventsFilter),
							...getFilterFromInitialState(filter),
					  }
					: defaultEventFilter,
			);
			this.setEventsRange(range);
		}

		this.sseFilterSubscription = reaction(
			() => this.searchStore.eventFilterInfo,
			this.initSSEFilter,
			{ fireImmediately: true },
		);
	}

	@observable
	public range: TimeRange = getDefaultTimeRange(this.graphStore.interval);

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
	public filter: null | EventsFilter = getDefaultEventsFiltersState(
		this.searchStore.eventFilterInfo,
	);

	@computed
	public get isFilterApplied(): boolean {
		if (!this.filter) return false;
		return getObjectKeys(this.filter).some((filterName: EventFilterKeys) => {
			if (filterName === 'status') {
				return this.filter && this.filter[filterName].values !== 'any';
			}
			return this.filter !== null && this.filter[filterName].values.length > 0;
		});
	}

	@action
	public setRange = (range: TimeRange) => {
		this.range = range;
	};

	@action
	public setEventsFilter = (filter: EventsFilter | null) => {
		this.filter = filter;
	};

	@action
	public resetEventsFilter = (): EventsFilter | null => {
		return getDefaultEventsFiltersState(this.searchStore.eventFilterInfo);
	};

	@action
	public setIsOpen = (state: boolean) => {
		this.isOpen = state;
	};

	@observable.ref
	public filterInfo: EventsFiltersInfo[] = [];

	@action
	private initSSEFilter = (filterInfo: EventsFiltersInfo[]) => {
		this.filterInfo = filterInfo;
		if (this.filter) {
			this.filter = {
				...(getDefaultEventsFiltersState(filterInfo) || {}),
				...this.filter,
			};
		} else {
			this.filter = getDefaultEventsFiltersState(filterInfo);
		}
	};

	@action
	public setEventsRange = (range: TimeRange) => {
		this.range = range;
	};

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
