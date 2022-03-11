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

import isEqual from 'lodash.isequal';
import { action, computed, reaction, when } from 'mobx';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { SearchPanelType } from '../../components/search-panel/SearchPanel';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../../components/search-panel/SearchPanelFilters';
import { sortByTimestamp } from '../../helpers/date';
import {
	getNonEmptyFilters,
	isEmptyFilter,
	isEventsFilterHistory,
	isMessagesFilterHistory,
} from '../../helpers/filters';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import notificationsStore from '../NotificationsStore';
import PersistedStore from './PerstistedStore';

export interface FiltersHistoryType<T extends FilterState> {
	timestamp: number;
	type: SearchPanelType;
	filters: Partial<T>;
	isPinned?: boolean;
}

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.FILTERS_HISTORY]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.FILTERS_HISTORY, api);

		reaction(
			() => [
				this.pinnedEventFilters,
				this.eventFilters,
				this.pinnedMessageFilters,
				this.messageFilters,
			],
			filterHistory => {
				if (!this.data) {
					return;
				}
				const filtersToDelete = filterHistory
					.filter(history => history.length > this.itemsPerType)
					.flatMap(history => history.slice(this.itemsPerType));

				if (filtersToDelete.length) {
					this.data = this.data.filter(filter => !filtersToDelete.includes(filter));
				}
			},
		);
	}

	private itemsPerType = persistedDataLimits[PersistedDataCollectionsNames.FILTERS_HISTORY] / 4;

	@computed
	private get allEventFilters() {
		if (this.data) {
			return sortByTimestamp(this.data.filter(isEventsFilterHistory));
		}
		return [];
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
		if (this.data) {
			return sortByTimestamp(this.data.filter(isMessagesFilterHistory));
		}
		return [];
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
	public get events(): FiltersHistoryType<EventFilterState>[] {
		return [...this.pinnedEventFilters, ...this.eventFilters];
	}

	@computed
	public get messages(): FiltersHistoryType<MessageFilterState>[] {
		return [...this.pinnedMessageFilters, ...this.messageFilters];
	}

	@action
	public onEventFilterSubmit = async (filters: EventFilterState, isPinned = false) => {
		if (isEmptyFilter(filters)) return;

		await when(() => this.initialized);
		this.addEventHistoryItem(
			getEquilizedItem({
				filters,
				timestamp: Date.now(),
				type: 'event',
				isPinned,
			}),
		);
	};

	@action
	public onMessageFilterSubmit = async (filters: MessageFilterState, isPinned = false) => {
		if (isEmptyFilter(filters)) return;

		await when(() => this.initialized);
		this.addMessageHistoryItem(
			getEquilizedItem({
				filters,
				timestamp: Date.now(),
				type: 'message',
				isPinned,
			}),
		);
	};

	@action
	public toggleFilterPin = (filter: FiltersHistoryType<MessageFilterState | EventFilterState>) => {
		if (!this.data) {
			return;
		}
		const filterToUpdate = this.data.find(f => f === filter);
		if (filterToUpdate) {
			const isPinned = !filter.isPinned;
			const timestamp = moment.utc().valueOf();

			filterToUpdate.isPinned = isPinned;
			filterToUpdate.timestamp = timestamp;
		}
	};

	@action
	public showSuccessNotification = (type: SearchPanelType) => {
		notificationsStore.addMessage({
			type: 'success',
			notificationType: 'success',
			description: `${type.charAt(0).toUpperCase()}${type.slice(1)} filter successfully saved!`,
			id: nanoid(),
		});
	};

	@action
	private addEventHistoryItem = async (newItem: FiltersHistoryType<EventFilterState>) => {
		if (!this.data) {
			return;
		}
		const existedFilter = this.events.find(({ filters }) => isEqual(filters, newItem.filters));
		if (existedFilter) {
			this.data = this.data.filter(f => f !== existedFilter);
		}
		this.addHistoryItem(newItem);
	};

	@action
	private addMessageHistoryItem = async (newItem: FiltersHistoryType<MessageFilterState>) => {
		if (!this.data) {
			return;
		}
		const existedFilter = this.messages.find(({ filters }) => isEqual(filters, newItem.filters));
		if (existedFilter) {
			this.data = this.data.filter(f => f !== existedFilter);
		}
		this.addHistoryItem(newItem);
	};

	@action
	private addHistoryItem = async (newItem: FiltersHistoryType<FilterState>) => {
		if (this.data) {
			this.data = [...this.data, newItem];
		}
	};
}

function getEquilizedItem(newItem: FiltersHistoryType<FilterState>) {
	const { type, timestamp, isPinned } = newItem;
	const equilizedFilter = getNonEmptyFilters(newItem.filters);
	return {
		timestamp,
		type,
		filters: equilizedFilter,
		isPinned,
	} as FiltersHistoryType<FilterState>;
}
