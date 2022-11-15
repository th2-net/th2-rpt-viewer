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

import { observable, action, toJS, computed, reaction, when } from 'mobx';
import isEqual from 'lodash.isequal';
import moment from 'moment';
import { nanoid } from 'nanoid';
import MessagesFilter from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { capitalize } from 'helpers/stringUtils';
import { FilterState } from 'models/search/Search';
import { ActionType } from 'models/EventAction';
import { IndexedDB, IndexedDbStores, indexedDbLimits } from '../api/indexedDb';
import {
	getNonEmptyFilters,
	isEmptyFilter,
	isEventsFilterHistory,
	isMessagesFilterHistory,
} from '../helpers/filters';
import { NotificationsStore } from './NotificationsStore';
import { sortByTimestamp } from '../helpers/date';

export type FilterType = ActionType.EVENT_ACTION | ActionType.MESSAGE;

export interface FiltersHistoryType<T extends EventsFilter | MessagesFilter> {
	timestamp: number;
	type: FilterType;
	filters: Partial<T>;
	isPinned?: boolean;
}

class FiltersHistoryStore {
	constructor(private indexedDb: IndexedDB, private notificationsStore: NotificationsStore) {
		this.init();

		reaction(
			() => [
				this.pinnedEventFilters,
				this.eventFilters,
				this.pinnedMessageFilters,
				this.messageFilters,
			],
			filterHistory => {
				const filtersToDelete = filterHistory
					.filter(history => history.length > this.dbItemsPerType)
					.flatMap(history => history.slice(this.dbItemsPerType));

				if (filtersToDelete.length) {
					filtersToDelete.forEach(f => {
						this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, f.timestamp);
					});
					this.filterHistory = this.filterHistory.filter(
						filter => !filtersToDelete.includes(filter),
					);
				}
			},
		);
	}

	private dbItemsPerType = indexedDbLimits[IndexedDbStores.FILTERS_HISTORY] / 4;

	@observable
	private initialized = false;

	@observable
	public filterHistory: FiltersHistoryType<EventsFilter | MessagesFilter>[] = [];

	@computed
	private get allEventFilters() {
		return sortByTimestamp(this.filterHistory.filter(isEventsFilterHistory));
	}

	@computed
	private get pinnedEventFilters() {
		return this.allEventFilters.filter(f => f.isPinned);
	}

	@computed
	private get eventFilters() {
		return this.allEventFilters.filter(f => !f.isPinned);
	}

	@computed
	private get allMessageFilters() {
		return sortByTimestamp(this.filterHistory.filter(isMessagesFilterHistory));
	}

	@computed
	private get pinnedMessageFilters() {
		return this.allMessageFilters.filter(f => f.isPinned);
	}

	@computed
	private get messageFilters() {
		return this.allMessageFilters.filter(f => !f.isPinned);
	}

	@computed
	public get eventsHistory(): FiltersHistoryType<EventsFilter>[] {
		return [...this.pinnedEventFilters, ...this.eventFilters];
	}

	@computed
	public get messagesHistory(): FiltersHistoryType<MessagesFilter>[] {
		return [...this.pinnedMessageFilters, ...this.messageFilters];
	}

	@action
	public onEventFilterSubmit = async (filters: EventsFilter, isPinned = false) => {
		if (isEmptyFilter(filters)) return;

		await when(() => this.initialized);
		this.addEventHistoryItem(
			getEquilizedItem({
				filters,
				timestamp: Date.now(),
				type: ActionType.EVENT_ACTION,
				isPinned,
			}),
		);
	};

	@action
	public onMessageFilterSubmit = async (filters: MessagesFilter, isPinned = false) => {
		if (isEmptyFilter(filters)) return;

		await when(() => this.initialized);
		this.addMessageHistoryItem(
			getEquilizedItem({
				filters,
				timestamp: Date.now(),
				type: ActionType.MESSAGE,
				isPinned,
			}),
		);
	};

	@action
	public toggleFilterPin = (filter: FiltersHistoryType<MessagesFilter | EventsFilter>) => {
		const filterToUpdate = this.filterHistory.find(f => f === filter);
		if (filterToUpdate) {
			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, filter.timestamp);
			const isPinned = !filter.isPinned;
			const timestamp = moment.utc().valueOf();

			filterToUpdate.isPinned = isPinned;
			filterToUpdate.timestamp = timestamp;
			this.indexedDb.updateDbStoreItem(IndexedDbStores.FILTERS_HISTORY, {
				...toJS(observable(filter)),
				isPinned,
				timestamp,
			});
		}
	};

	@action
	public showSuccessNotification = (type: FilterType) => {
		this.notificationsStore.addMessage({
			type: 'success',
			notificationType: 'success',
			description: `${capitalize(type)} filter successfully saved!`,
			id: nanoid(),
		});
	};

	private init = async () => {
		const history = await this.indexedDb.getStoreValues<
			FiltersHistoryType<EventsFilter | MessagesFilter>
		>(IndexedDbStores.FILTERS_HISTORY);
		this.filterHistory = history;
		this.initialized = true;
	};

	@action
	private addEventHistoryItem = async (newItem: FiltersHistoryType<EventsFilter>) => {
		const existedFilter = this.eventsHistory.find(({ filters }) =>
			isEqual(filters, newItem.filters),
		);
		if (existedFilter) {
			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, existedFilter.timestamp);
			this.filterHistory = this.filterHistory.filter(f => f !== existedFilter);
		}
		this.addHistoryItem(newItem);
	};

	@action
	private addMessageHistoryItem = async (newItem: FiltersHistoryType<MessagesFilter>) => {
		const existedFilter = this.messagesHistory.find(({ filters }) =>
			isEqual(filters, newItem.filters),
		);
		if (existedFilter) {
			this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, existedFilter.timestamp);
			this.filterHistory = this.filterHistory.filter(f => f !== existedFilter);
		}
		this.addHistoryItem(newItem);
	};

	@action
	private addHistoryItem = async (newItem: FiltersHistoryType<MessagesFilter | EventsFilter>) => {
		this.indexedDb.addDbStoreItem(IndexedDbStores.FILTERS_HISTORY, newItem);
		this.filterHistory = [...this.filterHistory, newItem];
	};

	@action
	public deleteHistoryItem = async (oldItem: FiltersHistoryType<FilterState>) => {
		this.indexedDb.deleteDbStoreItem(IndexedDbStores.FILTERS_HISTORY, oldItem.timestamp);
		this.filterHistory = this.filterHistory.filter(
			historyItem => historyItem.timestamp !== oldItem.timestamp,
		);
	};
}

export default FiltersHistoryStore;

function getEquilizedItem(newItem: FiltersHistoryType<MessagesFilter | EventsFilter>) {
	const { type, timestamp, isPinned } = newItem;
	const equilizedFilter = getNonEmptyFilters(newItem.filters);
	return {
		timestamp,
		type,
		filters: equilizedFilter,
		isPinned,
	} as FiltersHistoryType<MessagesFilter | EventsFilter>;
}
