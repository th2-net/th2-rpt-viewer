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

import { action, computed, observable, reaction, toJS } from 'mobx';
import moment from 'moment';
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';
import { MessageFilterState } from '../components/search-panel/SearchPanelFilters';

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
	isMessagesFilterApplied: boolean;
}>;

export default class FilterStore {
	constructor(initialState?: InitialState) {
		this.init(initialState);
	}

	@observable messagesFilter: MessagesFilter = defaultMessagesFilter;

	@observable sseMessagesFilter: MessageFilterState | null = null;

	@observable isMessagesFilterApplied = false;

	@observable eventsFilter: EventsFilter = getDefaultEventFilter();

	@computed get isEventsFilterApplied() {
		return this.eventsFilter.eventTypes.length > 0 || this.eventsFilter.names.length > 0;
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

	@action
	resetMessagesFilter(streams: string[] = []) {
		this.messagesFilter = {
			...defaultMessagesFilter,
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
		this.eventsFilter = getDefaultEventFilter();
	}

	@action
	private init(initialState?: InitialState) {
		if (!initialState) return;

		const {
			eventsFilter = getDefaultEventFilter(),
			messagesFilter = defaultMessagesFilter,
			isMessagesFilterApplied = false,
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

		this.isMessagesFilterApplied = isMessagesFilterApplied;
	}
}
