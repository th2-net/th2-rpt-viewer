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

import { action, autorun, observable } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import { SearchResult, StateHistory } from '../SearchStore';
import PersistedStore from './PerstistedStore';

export type SearchHistory = {
	timestamp: number;
	results: Record<string, Array<SearchResult>>;
	request: StateHistory;
	progress: {
		previous: number;
		next: number;
	};
	processedObjectCount: {
		previous: number;
		next: number;
	};
};

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.SEARCH_HISTORY]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.SEARCH_HISTORY, api);
		autorun(() => {
			this.currentSearch = this.data && this.data[this.currentIndex];
		});
	}

	@observable
	public currentSearch: SearchHistory | null = null;

	@observable
	public currentIndex = this.data ? (this.data.length > 0 ? this.data.length - 1 : 0) : 0;

	@action
	public deleteSearchHistoryItem = (searchHistoryItem: SearchHistory) => {
		if (!this.data) return;

		this.data = this.data.filter(item => item.timestamp !== searchHistoryItem.timestamp);
		this.currentIndex = Math.max(this.currentIndex - 1, 0);
	};

	@action
	public nextSearchHistoryIndex = () => {
		if (!this.data) return;

		if (this.currentIndex < this.data.length - 1) {
			this.currentIndex += 1;
		}
	};

	@action
	public prevSearchHistoryIndex = () => {
		if (this.currentIndex !== 0) {
			this.currentIndex -= 1;
		}
	};

	@action
	public setNewSearchHistoryItem = (searchHistoryItem: SearchHistory) => {
		if (!this.data) return;
		const newHistory = [...this.data, searchHistoryItem];
		if (newHistory.length > persistedDataLimits[PersistedDataCollectionsNames.SEARCH_HISTORY]) {
			this.data = newHistory.slice(1);
		} else {
			this.data = newHistory;
		}
		this.currentIndex = this.data.length - 1;
	};

	@action
	public saveSearchResultsToHistory = (search: SearchHistory) => {
		if (!this.data) return;

		const hasSame = this.data.some(historyItem => historyItem.timestamp === search.timestamp);

		if (hasSame) {
			this.data = this.data.reduce((prev: SearchHistory[], curr: SearchHistory) => {
				if (curr.timestamp === search.timestamp) {
					return [...prev, search];
				}
				return [...prev, curr];
			}, []);
		} else {
			this.setNewSearchHistoryItem(search);
		}
	};
}
