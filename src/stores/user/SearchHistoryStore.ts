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

import { action, observable, reaction } from 'mobx';
import { SearchResult, SearchStore, StateHistory } from '../SearchStore';
import UserDataStore, { userDataStoreLimits } from './UserDataStore';

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

export default class SearchHistoryStore {
	constructor(private userStore: UserDataStore, private searchStore: SearchStore) {
		reaction(() => this.history, this.userStore.syncSearchHistory);
	}

	@observable
	public history: SearchHistory[] = this.userStore.userPrefs?.searchHistory || [];

	@observable
	public currentIndex = this.history.length > 0 ? this.history.length - 1 : 0;

	@action
	public deleteHistoryItem = (searchHistoryItem: SearchHistory) => {
		this.history = this.history.filter(item => item !== searchHistoryItem);
		this.currentIndex = Math.max(this.currentIndex - 1, 0);

		this.searchStore.resetSearchProgressState();

		if (this.history.length !== 0) {
			this.searchStore.setCompleted(true);
		}
	};

	@action
	public nextSearch = () => {
		if (this.currentIndex < this.history.length - 1) {
			this.currentIndex += 1;
		}
		this.searchStore.resetSearchProgressState();
		this.searchStore.setCompleted(true);
	};

	@action
	public prevSearch = () => {
		if (this.currentIndex !== 0) {
			this.currentIndex -= 1;
		}
		this.searchStore.resetSearchProgressState();
		this.searchStore.setCompleted(true);
	};

	@action
	public newSearch = (searchHistoryItem: SearchHistory) => {
		const newHistory = [...this.history, searchHistoryItem];
		if (newHistory.length > userDataStoreLimits.searchHistory) {
			this.history = newHistory.slice(1);
		} else {
			this.history = newHistory;
		}
		this.currentIndex = this.history.length - 1;
		this.searchStore.resetSearchProgressState();
	};

	@action
	public saveSearchResults = (search: SearchHistory) => {
		const hasSame = this.history.some(historyItem => historyItem.timestamp === search.timestamp);

		if (hasSame) {
			this.history = this.history.reduce((prev: SearchHistory[], curr: SearchHistory) => {
				if (curr.timestamp === search.timestamp) {
					return [...prev, search];
				}
				return [...prev, curr];
			}, []);
		} else {
			this.newSearch(search);
		}
	};
}
