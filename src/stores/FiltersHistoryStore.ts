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

import { observable, action } from 'mobx';
import { IndexedDB, IndexedDbStores, indexedDbLimits } from '../api/indexedDb';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	MessageFilterState,
	FilterState,
} from '../components/search-panel/SearchPanelFilters';
import { getEquilizedFilterState } from '../helpers/search';

export interface FiltersHistoryType<T extends FilterState> {
	timestamp: number;
	type: SearchPanelType;
	filters: Partial<T>;
}

type History = [FiltersHistoryType<EventFilterState>[], FiltersHistoryType<MessageFilterState>[]];

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public history: History = [[], []];

	@action
	public addHistoryItem = async <T extends FilterState>(newFilters: FiltersHistoryType<T>) => {
		const { type, timestamp } = newFilters;
		const equalizedFilter = getEquilizedFilterState(newFilters.filters as T);
		const index = type === 'event' ? 0 : 1;

		const historyToChange: (
			| FiltersHistoryType<EventFilterState>
			| FiltersHistoryType<MessageFilterState>
		)[] = this.history[index];

		const hasSame = historyToChange.some(({ filters }) => {
			return JSON.stringify(filters) === JSON.stringify(equalizedFilter);
		});
		if (hasSame) {
			return;
		}

		const filter = { timestamp, type, filters: equalizedFilter };

		if (this.isFull(index)) {
			this.history[index].shift();
			this.history[index].push(filter);

			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, timestamp);
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
			return;
		}
		this.history[index].push(filter);
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
	};

	private isFull(index: number): boolean {
		return this.history[index].length >= indexedDbLimits[IndexedDbStores.FILTERS_HISTORY];
	}

	private init = async <T extends FilterState>() => {
		const history = await this.indexedDb.getStoreValues<FiltersHistoryType<T>>(
			IndexedDbStores.FILTERS_HISTORY,
		);
		const separatedHistory: History = [[], []];
		for (const item of history) {
			if (item.type === 'event') {
				separatedHistory[0].push(item as FiltersHistoryType<EventFilterState>);
			} else {
				separatedHistory[1].push(item as FiltersHistoryType<MessageFilterState>);
			}
		}
		this.history = separatedHistory;
	};
}

export default FiltersHistoryStore;
