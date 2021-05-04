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
import { SavedFilters } from './FilterAutocompletesStore';

export interface FiltersHistory {
	timestamp: number;
	type: SearchPanelType;
	filters: SavedFilters;
}

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public history: FiltersHistory[] = [];

	@action
	public addHistoryItem = async (filters: FiltersHistory) => {
		if (this.isFull) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const [_, ...rest] = this.history;
			this.history = [...rest, filters];

			const all = await this.indexedDb.getStoreValues<FiltersHistory>(
				IndexedDbStores.FILTERS_HISTORY,
			);
			const first = all[0];
			if (first) {
				this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, first.timestamp);
			}
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filters);
			return;
		}
		this.history = [...this.history, filters];
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filters);
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
