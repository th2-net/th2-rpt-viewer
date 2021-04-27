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

import { observable, runInAction, toJS, action } from 'mobx';
import { nanoid } from 'nanoid';
import { IndexedDB, indexedDbLimits, IndexedDbStores } from '../api/indexedDb';
import notificationsStore from './NotificationsStore';
import { SearchPanelType } from '../components/search-panel/SearchPanel';

export interface FilterAutocompletesObject {
	timestamp: number;
	filters: FilterAutocompletes;
}

export interface FiltersToSave {
	[k: string]: string | string[];
}

export interface FilterAutocompletes {
	[k: string]: string[];
}

class FilterAutocompletesStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	public idbId: number | null = null;

	@observable
	public autocompletes: FilterAutocompletes = {};

	public saveAutocompletes = async (FiltersToSave: FiltersToSave, type: SearchPanelType) => {
		const savedFilters = toJS(this.autocompletes);
		const timestamp = toJS(this.idbId);

		if (timestamp) {
			const limit = indexedDbLimits[IndexedDbStores.FILTER_AUTOCOMPLETES];
			const newSavedFilters = Object.entries(FiltersToSave).map(([key, value]) => {
				const currentFilterValues = savedFilters[key];
				const keyToAdd = key === 'type' || key === 'body' ? `${type}-${key}` : key;

				if (typeof value === 'string') {
					if (!currentFilterValues && value) {
						return [keyToAdd, [value]];
					}
					if (currentFilterValues.includes(value)) {
						return [keyToAdd, currentFilterValues];
					}
					if (currentFilterValues.length < limit) {
						return [keyToAdd, [...currentFilterValues, value]];
					}
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const [_, ...rest] = currentFilterValues;
					return [keyToAdd, [...rest, value]];
				}

				if (!currentFilterValues) {
					return [keyToAdd, value];
				}
				const valuesToAdd = value.filter(v => !currentFilterValues.includes(v));
				const newLength = currentFilterValues.length + valuesToAdd.length;
				const slicePoint = newLength - limit;

				if (currentFilterValues.length < limit) {
					if (newLength < limit) {
						return [keyToAdd, [...currentFilterValues, ...valuesToAdd]];
					}
					return [keyToAdd, [...currentFilterValues, ...valuesToAdd.slice(0, slicePoint)]];
				}
				return [keyToAdd, [...currentFilterValues.slice(slicePoint), ...valuesToAdd]];
			});
			const filters = { ...savedFilters, ...Object.fromEntries(newSavedFilters) };
			let error;
			try {
				await this.indexedDb.updateDbStoreItem(IndexedDbStores.FILTER_AUTOCOMPLETES, {
					timestamp,
					filters,
				});
			} catch (err) {
				error = err;
				notificationsStore.addMessage({
					errorType: 'indexedDbMessage',
					type: 'error',
					header: `Failed to save filters`,
					description: '',
					id: nanoid(),
				});
			} finally {
				if (!error) {
					this.setAutocompletes(filters);
				}
			}
		}
	};

	@action
	private setAutocompletes = (filters: FilterAutocompletes) => {
		this.autocompletes = filters;
	};

	private init = async () => {
		const autocomletes = await this.indexedDb.getStoreValues<FilterAutocompletesObject>(
			IndexedDbStores.FILTER_AUTOCOMPLETES,
		);
		let timestamp: number;
		let filters: FilterAutocompletes;
		if (!autocomletes.length) {
			timestamp = Date.now();
			filters = {
				attachedEventIds: [],
				attachedMessageId: [],
				parentEvent: [],
				name: [],
				'event-body': [],
				'message-body': [],
				'event-type': [],
				'message-type': [],
			};
			this.indexedDb.addDbStoreItem(IndexedDbStores.FILTER_AUTOCOMPLETES, {
				timestamp,
				filters,
			});
		}
		timestamp = autocomletes[0].timestamp;
		filters = autocomletes[0].filters;
		runInAction(() => {
			this.autocompletes = filters;
			this.idbId = timestamp;
		});
	};
}

export default FilterAutocompletesStore;
