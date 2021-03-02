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

export function getDefaultEventFilter() {
	const timestampTo = moment.utc().valueOf();
	const timestampFrom = moment.utc(timestampTo).subtract(15, 'minutes').valueOf();

	return {
		timestampTo,
		timestampFrom,
		eventTypes: [],
		names: [],
	};
}

export type EventsFilterStoreInitialState = Partial<EventsFilter>;

export default class EventsFilterStore {
	constructor(initialState?: EventsFilterStoreInitialState) {
		if (initialState) {
			const { names, eventTypes, timestampTo, timestampFrom } = initialState;
			const defaultEventsFilter = getDefaultEventFilter();

			this.setEventsFilter({
				names: names || defaultEventsFilter.names,
				eventTypes: eventTypes || defaultEventsFilter.eventTypes,
				timestampTo: timestampTo || defaultEventsFilter.timestampTo,
				timestampFrom: timestampFrom || defaultEventsFilter.timestampFrom,
			});
		}
	}

	@observable filter: EventsFilter = getDefaultEventFilter();

	@computed
	public get isEventsFilterApplied() {
		return this.filter.eventTypes.length > 0 || this.filter.names.length > 0;
	}

	@action
	setEventsFilter(filter: EventsFilter) {
		this.filter = filter;
	}

	@action
	resetEventsFilter() {
		this.filter = getDefaultEventFilter();
	}
}
