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

import { observable, computed, action } from 'mobx';
import { IndexedDB, IndexedDbStores, indexedDbLimits } from '../api/indexedDb';
import { SearchPanelType } from '../components/search-panel/SearchPanel';
import {
	EventFilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';

export interface FiltersHistory {
	timestamp: number;
	type: SearchPanelType;
	filters: Partial<EventFilterState> | Partial<MessageFilterState>;
}

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public history: FiltersHistory[] = [];

	@action
	public addHistoryItem = async (newFilters: FiltersHistory) => {
		const hasSame = this.history.some(({ filters }) => {
			return JSON.stringify(filters) === JSON.stringify(newFilters.filters);
		});
		if (hasSame) {
			return;
		}
		if (this.isFull) {
			this.history = [...this.history.slice(1), newFilters];

			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, newFilters.timestamp);
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, newFilters);
			return;
		}
		this.history = [...this.history, newFilters];
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, newFilters);
	};

	@computed
	private get isFull(): boolean {
		return this.history.length >= indexedDbLimits[IndexedDbStores.FILTERS_HISTORY];
	}

	private init = async () => {
		const history = await this.indexedDb.getStoreValues<FiltersHistory>(
			IndexedDbStores.FILTERS_HISTORY,
		);
		this.history = history;
	};
}

export default FiltersHistoryStore;
