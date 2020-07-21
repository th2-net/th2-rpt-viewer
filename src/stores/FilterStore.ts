/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import {
	action,
	computed,
	observable,
	toJS,
} from 'mobx';
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';

export default class FilterStore {
	constructor(filterStore?: FilterStore) {
		if (filterStore) {
			this.messagesFilter = toJS(filterStore.messagesFilter);
			this.eventsFilter = toJS(filterStore.eventsFilter);
			this.isMessagesFilterApplied = filterStore.isMessagesFilterApplied.valueOf();
		}
	}

	@observable messagesFilter: MessagesFilter = {
		timestampFrom: null,
		timestampTo: null,
		streams: [],
		messageTypes: [],
	};

	@observable isMessagesFilterApplied = false;

	@observable eventsFilter: EventsFilter = {
		timestampFrom: null,
		timestampTo: null,
		eventTypes: [],
		names: [],
	};

	@computed
	get isEventsFilterApplied() {
		return this.eventsFilter.timestampFrom !== null
			|| this.eventsFilter.timestampTo !== null
			|| this.eventsFilter.eventTypes.length !== 0
			|| this.eventsFilter.names.length !== 0;
	}

	@action
	setMessagesFilter(filter?: MessagesFilter) {
		if (!filter) {
			this.resetMessagesFilter();
			return;
		}
		this.messagesFilter = filter;
		this.isMessagesFilterApplied = true;
	}

	@action resetMessagesFilter(streams: string[] = []) {
		this.messagesFilter = {
			timestampFrom: null,
			timestampTo: null,
			streams,
			messageTypes: [],
		};
		this.isMessagesFilterApplied = false;
	}

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
		this.eventsFilter = {
			timestampFrom: null,
			timestampTo: null,
			eventTypes: [],
			names: [],
		};
	}
}
