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

import { action, computed, observable } from 'mobx';
import moment from 'moment';
import EventsFilter from '../../models/filter/EventsFilter';
import { GraphStore } from '../GraphStore';

export function getDefaultEventFilter(interval = 15) {
	const timestampTo = moment.utc().valueOf();
	const timestampFrom = moment.utc(timestampTo).subtract(interval, 'minutes').valueOf();

	return {
		timestampTo,
		timestampFrom,
		eventTypes: [],
		names: [],
	};
}

export type EventsFilterStoreInitialState = Partial<EventsFilter>;

export default class EventsFilterStore {
	constructor(private graphStore: GraphStore, initialState?: EventsFilterStoreInitialState) {
		if (initialState) {
			const defaultEventsFilter = getDefaultEventFilter(this.graphStore.interval);
			const {
				names = defaultEventsFilter.names,
				eventTypes = defaultEventsFilter.eventTypes,
				timestampTo = defaultEventsFilter.timestampTo,
				timestampFrom = defaultEventsFilter.timestampFrom,
			} = initialState;

			this.setEventsFilter({
				names,
				eventTypes,
				timestampTo,
				timestampFrom,
			});
		}
	}

	@observable
	public filter: EventsFilter = getDefaultEventFilter(this.graphStore.interval);

	@computed
	public get isEventsFilterApplied() {
		return this.filter.eventTypes.length > 0 || this.filter.names.length > 0;
	}

	@action
	public setEventsFilter(filter: EventsFilter) {
		this.filter = filter;
	}

	@action
	public changeTimestamp(mins: number) {
		const currentFilter = this.filter;
		this.setEventsFilter({
			...currentFilter,
			timestampFrom: moment.utc(currentFilter.timestampFrom).add(mins, 'minutes').valueOf(),
			timestampTo: moment.utc(currentFilter.timestampTo).add(mins, 'minutes').valueOf(),
		});
	}

	@action
	public resetEventsFilter() {
		this.filter = {
			...getDefaultEventFilter(this.graphStore.interval),
			timestampFrom: this.filter.timestampFrom,
			timestampTo: this.filter.timestampTo,
		};
	}
}
