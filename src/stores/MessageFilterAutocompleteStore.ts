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
import { MessageFilterState } from '../components/search-panel/SearchPanelFilters';
import { getEquilizedFilterState } from '../helpers/search';

export interface MessageFilterAutocomplete {
	timestamp: number;
	filters: MessageFilterState;
}

class MessageFilterAutocompleteStore {
	constructor(private indexedDb: IndexedDB) {
		this.init();
	}

	@observable
	public autocompletes: MessageFilterAutocomplete[] = [];

	@action
	public addFilter = async (newFilters: MessageFilterAutocomplete) => {
		const { timestamp } = newFilters;
		const equalizedFilter = getEquilizedFilterState(newFilters.filters);
		const hasSame = this.autocompletes.some(filters => {
			return JSON.stringify(filters) === JSON.stringify(equalizedFilter);
		});
		if (hasSame) {
			return;
		}
		const filter = { timestamp, filters: equalizedFilter as MessageFilterState };
		if (this.isFull) {
			this.autocompletes = [...this.autocompletes.slice(1), filter];

			this.indexedDb.deleteDbStoreItem(IndexedDbStores.MESSAGE_FILTER_AUTOCOMPLETES, timestamp);
			this.indexedDb.addDbStoreItem(IndexedDbStores.MESSAGE_FILTER_AUTOCOMPLETES, filter);
			return;
		}
		this.autocompletes = [...this.autocompletes, filter];
		this.indexedDb.addDbStoreItem(IndexedDbStores.MESSAGE_FILTER_AUTOCOMPLETES, filter);
	};

	@computed
	private get isFull(): boolean {
		return (
			this.autocompletes.length >= indexedDbLimits[IndexedDbStores.MESSAGE_FILTER_AUTOCOMPLETES]
		);
	}

	private init = async () => {
		const autocompletes = await this.indexedDb.getStoreValues<MessageFilterAutocomplete>(
			IndexedDbStores.MESSAGE_FILTER_AUTOCOMPLETES,
		);
		this.autocompletes = autocompletes;
	};
}

export default MessageFilterAutocompleteStore;
