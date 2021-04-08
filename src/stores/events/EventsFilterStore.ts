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
import { EventsFiltersInfo, EventSSEFilters } from '../../api/sse';
import { EventFilterState } from '../../components/search-panel/SearchPanelFilters';
import { getDefaultEventsFiltersState } from '../../helpers/search';
import { TimeRange } from '../../models/Timestamp';
import { getObjectKeys } from '../../helpers/object';

function getDefaultTimeRange(interval = 15): TimeRange {
	const timestampTo = moment.utc().valueOf();
	const timestampFrom = moment.utc(timestampTo).subtract(interval, 'minutes').valueOf();

	return [timestampFrom, timestampTo];
}

export type EventsFilterStoreInitialState = Partial<{
	range: TimeRange;
	filter: Partial<EventFilterState>;
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
			this.filter = filter
				? {
						...((defaultEventFilter || {}) as EventsFilter),
						...filter,
				  }
				: defaultEventFilter;

			this.setEventsRange(range);
		}

		this.sseFilterSubscription = reaction(
			() => this.searchStore.eventFilterInfo,
			this.initSSEFilter,
		);
	}

	@observable
	public range: TimeRange = getDefaultTimeRange(this.graphStore.interval);

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
	public get isEventsFilterApplied(): boolean {
		if (!this.filter) return false;
		return getObjectKeys(this.filter).some((filterName: EventSSEFilters) => {
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
	public setEventsFilter(filter: EventsFilter | null) {
		this.filter = filter;
	}

	@action
	public resetEventsFilter(): EventsFilter | null {
		return getDefaultEventsFiltersState(this.searchStore.eventFilterInfo);
	}

	@action
	private initSSEFilter = (filterInfo: EventsFiltersInfo[]) => {
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
