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

function getEquilizedFilterState(filter: FilterState) {
	return Object.fromEntries(
		Object.entries(filter)
			.filter(
				([key, value]) => key !== 'status' && value && value.values && value.values.length > 0,
			)
			.map(([key, value]) => [
				key,
				toJS(
					value
						? typeof value.values === 'string'
							? value
							: { ...value, values: value.values.sort() }
						: {},
				),
			]),
	);
}

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
	public addToEventsHistory = async <T extends EventFilterState>(
		newFilters: FiltersHistoryType<T>,
	) => {
		if (!Object.values(newFilters.filters).some(v => v.values.length > 0)) {
			return;
		}

		const { type, timestamp } = newFilters;
		const equilizedFilter = toJS(getEquilizedFilterState(newFilters.filters as T));

		const hasSame = this.eventsHistory.some(({ filters }) => {
			return isEqual(filters, equilizedFilter);
		});
		if (hasSame) {
			return;
		}

		const filter = { timestamp, type, filters: equilizedFilter };

		if (this.isFull('event')) {
			this.eventsHistory.shift();
			this.eventsHistory.push(filter);

			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, timestamp);
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
			return;
		}
		this.eventsHistory.push(filter);
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
		const equilizedFilter = toJS(getEquilizedFilterState(newFilters.filters as T));

		const hasSame = this.eventsHistory.some(({ filters }) => {
			return isEqual(filters, equilizedFilter);
		});
		if (hasSame) {
			return;
		}

		const filter = { timestamp, type, filters: equilizedFilter };

		if (this.isFull('event')) {
			this.messagesHistory.shift();
			this.messagesHistory.push(filter);

			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, timestamp);
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
			return;
		}
		this.messagesHistory.push(filter);
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
	};

	private isFull(type: 'event' | 'message'): boolean {
		return type === 'event'
			? this.eventsHistory.length >= indexedDbLimits[IndexedDbStores.FILTERS_HISTORY]
			: this.messagesHistory.length >= indexedDbLimits[IndexedDbStores.FILTERS_HISTORY];
	}

	private init = async <T extends FilterState>() => {
		const history = await this.indexedDb.getStoreValues<FiltersHistoryType<T>>(
			IndexedDbStores.FILTERS_HISTORY,
		);
		for (const item of history) {
			if (item.type === 'event') {
				this.eventsHistory.push(item as FiltersHistoryType<EventFilterState>);
			} else {
				this.messagesHistory.push(item as FiltersHistoryType<MessageFilterState>);
			}
		}
	};
}

export default FiltersHistoryStore;
