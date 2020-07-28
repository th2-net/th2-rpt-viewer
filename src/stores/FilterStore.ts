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
	reaction,
} from 'mobx';
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';

export const defaultMessagesFilter: MessagesFilter = {
	timestampFrom: null,
	timestampTo: null,
	streams: [],
	messageTypes: [],
};

export const defaultEventsFilter: EventsFilter = {
	timestampFrom: null,
	timestampTo: null,
	eventTypes: [],
	names: [],
};

type InitialState = Partial<{
	messagesFilter: MessagesFilter;
	eventsFilter: EventsFilter;
	isMessagesFilterApplied: boolean;
}>;

export default class FilterStore {
	constructor(initialState?: InitialState) {
		this.init(initialState);
	}

	@observable messagesFilter: MessagesFilter = defaultMessagesFilter;

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
			...defaultMessagesFilter,
			// after resetting filter, streams should be taken from attached messages
			streams,
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
		this.eventsFilter = defaultEventsFilter;
	}

	@action
	private init(initialState?: InitialState) {
		if (!initialState) return;
		const {
			eventsFilter = defaultEventsFilter,
			messagesFilter = defaultMessagesFilter,
			isMessagesFilterApplied = false,
		} = initialState;

		this.eventsFilter = {
			names: eventsFilter.names || defaultEventsFilter.names,
			eventTypes: eventsFilter.eventTypes || defaultEventsFilter.eventTypes,
			timestampFrom: eventsFilter.timestampFrom || defaultEventsFilter.timestampFrom,
			timestampTo: eventsFilter.timestampTo || defaultEventsFilter.timestampTo,
		};

		this.messagesFilter = {
			timestampFrom: messagesFilter.timestampFrom || defaultMessagesFilter.timestampFrom,
			timestampTo: messagesFilter.timestampTo || defaultMessagesFilter.timestampTo,
			messageTypes: messagesFilter.messageTypes || defaultMessagesFilter.messageTypes,
			streams: messagesFilter.streams || defaultMessagesFilter.streams,
		};

		this.isMessagesFilterApplied = isMessagesFilterApplied;
	}
}
