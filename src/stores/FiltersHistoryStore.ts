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

import { observable, action, toJS } from 'mobx';
import isEqual from 'lodash.isequal';
import { IndexedDB, IndexedDbStores, indexedDbLimits } from '../api/indexedDb';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	MessageFilterState,
	FilterState,
} from '../components/search-panel/SearchPanelFilters';
import {
	getNonEmptyFilters,
	isEmptyFilter,
	isEventsFilterHistory,
	isMessagesFilterHistory,
	sortByTimestamp,
} from '../helpers/filters';

export interface FiltersHistoryType<T extends FilterState> {
	timestamp: number;
	type: SearchPanelType;
	filters: Partial<T>;
}

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public eventsHistory: FiltersHistoryType<EventFilterState>[] = [];

	@observable
	public messagesHistory: FiltersHistoryType<MessageFilterState>[] = [];

	@action
	public addToEventsHistory = async (newFilters: FiltersHistoryType<EventFilterState>) => {
		if (isEmptyFilter(newFilters.filters)) return;

		const { type, timestamp } = newFilters;
		const equilizedFilter = toJS(getNonEmptyFilters(toJS(newFilters.filters)));

		if (this.eventsHistory.some(({ filters }) => isEqual(filters, equilizedFilter))) return;

		const filter = { timestamp, type, filters: equilizedFilter };

		if (this.isFull('event')) {
			const last = this.eventsHistory.pop();
			this.eventsHistory.unshift(filter);

			if (last) {
				this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, last.timestamp);
			}
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
			return;
		}
		this.eventsHistory.unshift(filter);

		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
	};

	@action
	public addToMessagesHistory = async <T extends MessageFilterState>(
		newFilters: FiltersHistoryType<T>,
	) => {
		if (!Object.values(newFilters.filters).some(v => v.values.length > 0)) {
			return;
		}

		const { type, timestamp } = newFilters;
		const equilizedFilter = toJS(getNonEmptyFilters(newFilters.filters as T));

		const hasSame = this.eventsHistory.some(({ filters }) => {
			return isEqual(filters, equilizedFilter);
		});
		if (hasSame) {
			return;
		}

		const filter = { timestamp, type, filters: equilizedFilter };

		if (this.isFull('event')) {
			const last = this.messagesHistory.pop();
			this.messagesHistory.unshift(filter);

			if (last) {
				this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, last.timestamp);
			}
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
			return;
		}
		this.messagesHistory.unshift(filter);
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
	};

	private isFull(type: 'event' | 'message'): boolean {
		const limit = indexedDbLimits[IndexedDbStores.FILTERS_HISTORY] / 2;
		return type === 'event'
			? this.eventsHistory.length >= limit
			: this.messagesHistory.length >= limit;
	}

	private init = async () => {
		const history = await this.indexedDb.getStoreValues<
			FiltersHistoryType<EventFilterState | MessageFilterState>
		>(IndexedDbStores.FILTERS_HISTORY);

		this.eventsHistory = history.filter(isEventsFilterHistory).sort(sortByTimestamp);
		this.messagesHistory = history.filter(isMessagesFilterHistory).sort(sortByTimestamp);
	};
}

export default FiltersHistoryStore;
