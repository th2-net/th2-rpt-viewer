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

const ONE_HOUR = 60 * 60 * 1000;

export default class FilterStore {
	@observable messagesFilter: MessagesFilter = {
		timestampFrom: new Date(new Date().getTime() - ONE_HOUR).getTime(),
		timestampTo: new Date().getTime(),
		stream: null,
		messageType: null,
	};

	@observable isMessagesFilterApplied = false;

	@observable eventsFilter: EventsFilter = {
		timestampFrom: null,
		timestampTo: null,
		eventType: null,
		name: null,
	};

	@computed
	get isEventsFilterApplied() {
		return Object.values(this.eventsFilter).some(field => field != null);
	}

	@action
	setMessagesFilter(filter: MessagesFilter) {
		this.messagesFilter = filter;
		this.isMessagesFilterApplied = true;
	}

	@action resetMessagesFilter() {
		this.messagesFilter = {
			timestampFrom: new Date(new Date().getTime() - ONE_HOUR).getTime(),
			timestampTo: new Date().getTime(),
			stream: null,
			messageType: null,
		};
		this.isMessagesFilterApplied = false;
	}

	@action
	setEventsFilter(filter: EventsFilter) {
		this.eventsFilter = filter;
	}

	@action
	resetEventsFilter() {
		this.eventsFilter = {
			timestampFrom: null,
			timestampTo: null,
			eventType: null,
			name: null,
		};
	}

	static copy(filterStore: FilterStore) {
		const copy = new FilterStore();
		copy.messagesFilter = toJS(filterStore.messagesFilter);
		copy.eventsFilter = toJS(filterStore.eventsFilter);

		return copy;
	}
}
