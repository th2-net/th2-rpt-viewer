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
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';
import { getTimeWindow } from '../helpers/date';

export const defaultMessagesFilter: MessagesFilter = {
	timestamp: null,
	timeInterval: null,
	timestampFrom: null,
	timestampTo: null,
	streams: [],
	messageTypes: [],
};

export const getDefaultEventFilter = () => {
	const timeInterval = 15;
	const timestamp = moment.utc().subtract(timeInterval, 'minutes').valueOf();
	const { timestampFrom, timestampTo } = getTimeWindow(timestamp, timeInterval, true);

	return {
		timestamp,
		timeInterval,
		timestampTo,
		timestampFrom,
		eventTypes: [],
		names: [],
	};
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

	@observable eventsFilter: EventsFilter = getDefaultEventFilter();

	@observable eventsTimeFilterIsApplied = false;

	@computed
	get isEventsFilterApplied() {
		return (
			this.eventsTimeFilterIsApplied ||
			this.eventsFilter.eventTypes.length !== 0 ||
			this.eventsFilter.names.length !== 0
		);
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
		this.eventsFilter = getDefaultEventFilter();
		this.eventsTimeFilterIsApplied = false;
	}

	@action
	private init(initialState?: InitialState) {
		if (!initialState) return;
		const defaultEventsFilter = getDefaultEventFilter();
		const {
			eventsFilter = defaultEventsFilter,
			messagesFilter = defaultMessagesFilter,
			isMessagesFilterApplied = false,
		} = initialState;

		this.eventsFilter = {
			names: eventsFilter.names || defaultEventsFilter.names,
			eventTypes: eventsFilter.eventTypes || defaultEventsFilter.eventTypes,
			timestamp: eventsFilter.timestamp || defaultEventsFilter.timestamp,
			timeInterval: eventsFilter.timeInterval || defaultEventsFilter.timeInterval,
			timestampTo: eventsFilter.timestampTo || defaultEventsFilter.timestampTo,
			timestampFrom: eventsFilter.timestampFrom || defaultEventsFilter.timestampFrom,
		};

		if (eventsFilter.timestamp || eventsFilter.timeInterval) {
			this.eventsTimeFilterIsApplied = true;
		}

		this.messagesFilter = {
			timestamp: messagesFilter.timestamp || defaultMessagesFilter.timestamp,
			timeInterval: messagesFilter.timeInterval || defaultMessagesFilter.timeInterval,
			messageTypes: messagesFilter.messageTypes || defaultMessagesFilter.messageTypes,
			streams: messagesFilter.streams || defaultMessagesFilter.streams,
			timestampTo: messagesFilter.timestampTo || defaultMessagesFilter.timestampTo,
			timestampFrom: messagesFilter.timestampFrom || defaultMessagesFilter.timestampFrom,
		};

		this.isMessagesFilterApplied = isMessagesFilterApplied;
	}
}
