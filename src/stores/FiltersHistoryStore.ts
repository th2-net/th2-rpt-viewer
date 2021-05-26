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

import { observable, action, toJS, computed } from 'mobx';
import isEqual from 'lodash.isequal';
import moment from 'moment';
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
	isPinned?: boolean;
}

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	private dbItemsPerType = indexedDbLimits[IndexedDbStores.FILTERS_HISTORY] / 3;

	@observable
	public filterHistory: FiltersHistoryType<EventFilterState | MessageFilterState>[] = [];

	@computed
	public get eventsHistory(): FiltersHistoryType<EventFilterState>[] {
		const eventFilters = this.filterHistory.filter(isEventsFilterHistory);
		const pinnedFilters = eventFilters.filter(filter => filter.isPinned);

		return [
			...pinnedFilters.sort(sortByTimestamp),
			...eventFilters.filter(filter => !pinnedFilters.includes(filter)).sort(sortByTimestamp),
		];
	}

	@computed
	public get messagesHistory(): FiltersHistoryType<MessageFilterState>[] {
		const messagesFilters = this.filterHistory.filter(isMessagesFilterHistory);
		const pinnedFilters = messagesFilters.filter(filter => filter.isPinned);

		return [
			...pinnedFilters.sort(sortByTimestamp),
			...messagesFilters.filter(filter => !pinnedFilters.includes(filter)).sort(sortByTimestamp),
		];
	}

	@action
	public onEventFilterSubmit = async (newFilters: FiltersHistoryType<EventFilterState>) => {
		if (isEmptyFilter(newFilters.filters)) return;

		const { type, timestamp } = newFilters;
		const equilizedFilter = getNonEmptyFilters(newFilters.filters);

		if (this.eventsHistory.some(({ filters }) => isEqual(filters, equilizedFilter))) return;

		const filter: FiltersHistoryType<EventFilterState> = {
			timestamp,
			type,
			filters: equilizedFilter,
			isPinned: false,
		};

		const itemsToDelete = this.eventsHistory
			.slice()
			.filter(f => !f.isPinned)
			.splice(this.dbItemsPerType);
		itemsToDelete.forEach(item => {
			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, item.timestamp);
		});
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
		this.filterHistory = [...this.filterHistory.filter(f => !itemsToDelete.includes(f)), filter];
	};

	@action
	public onMessageFilterSubmit = async (newFilters: FiltersHistoryType<MessageFilterState>) => {
		if (isEmptyFilter(newFilters.filters)) return;

		const { type, timestamp } = newFilters;
		const equilizedFilter = getNonEmptyFilters(newFilters.filters);

		if (this.messagesHistory.some(({ filters }) => isEqual(filters, equilizedFilter))) return;

		const filter: FiltersHistoryType<MessageFilterState> = {
			timestamp,
			type,
			filters: equilizedFilter,
			isPinned: false,
		};

		const itemsToDelete = this.messagesHistory
			.slice()
			.filter(f => !f.isPinned)
			.splice(this.dbItemsPerType);

		itemsToDelete.forEach(item => {
			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, item.timestamp);
		});
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter);
		this.filterHistory = [...this.filterHistory.filter(f => !itemsToDelete.includes(f)), filter];
	};

	@action
	public toggleFilterPin = (filter: FiltersHistoryType<MessageFilterState | EventFilterState>) => {
		const filterToUpdate = this.filterHistory.find(f => f === filter);

		if (filterToUpdate) {
			const isPinned = !filter.isPinned;
			const timestamp = moment.utc().valueOf();
			const itemsToDelete = this.filterHistory
				.slice()
				.sort(sortByTimestamp)
				.filter(f => !f.isPinned)
				.splice(this.dbItemsPerType);

			itemsToDelete.forEach(item => {
				this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, item.timestamp);
			});

			filterToUpdate.isPinned = isPinned;
			filterToUpdate.timestamp = timestamp;
			this.indexedDb.updateDbStoreItem(IndexedDbStores.FILTERS_HISTORY, {
				...toJS(observable(filter)),
				isPinned,
				timestamp,
			});

			this.filterHistory = this.filterHistory.filter(f => !itemsToDelete.includes(f));
		}
	};

	private init = async () => {
		const history = await this.indexedDb.getStoreValues<
			FiltersHistoryType<EventFilterState | MessageFilterState>
		>(IndexedDbStores.FILTERS_HISTORY);

		this.filterHistory = history.sort(sortByTimestamp);
	};
}

export default FiltersHistoryStore;
