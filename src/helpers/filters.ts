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

import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { FiltersHistoryType } from '../stores/FiltersHistoryStore';
import { notEmpty } from './object';

export function getNonEmptyFilters(filter: Partial<FilterState>) {
	return Object.fromEntries(
		Object.entries(filter).filter(([_, value]) => value && value.values && value.values.length > 0),
	);
}

export function isEventsFilterHistory(
	filter: unknown,
): filter is FiltersHistoryType<EventFilterState> {
	return notEmpty(filter) && (filter as FiltersHistoryType<EventFilterState>).type === 'event';
}

export function isMessagesFilterHistory(
	filter: unknown,
): filter is FiltersHistoryType<MessageFilterState> {
	return notEmpty(filter) && (filter as FiltersHistoryType<EventFilterState>).type === 'event';
}

export function isEmptyFilter(filter: Partial<EventFilterState>) {
	return !Object.values(filter)
		.filter(notEmpty)
		.some(filterValues => filterValues.values.length > 0);
}
