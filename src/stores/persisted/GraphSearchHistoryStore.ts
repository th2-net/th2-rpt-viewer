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

import { action, computed } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { GraphSearchResult } from '../../components/graph/search/GraphSearch';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import PersistedStore from './PerstistedStore';

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY, api);
	}

	@computed
	public get sortedHistory() {
		if (!this.data) {
			return [];
		}
		const sortedHistory = this.data.slice();
		sortedHistory.sort((itemA, itemB) => {
			if (itemA.timestamp > itemB.timestamp) return -1;
			if (itemA.timestamp < itemB.timestamp) return 1;
			return 0;
		});

		return sortedHistory;
	}

	@action
	public addHistoryItem = (item: GraphSearchResult) => {
		if (!this.data || !item) {
			return;
		}
		if (
			this.data.length === persistedDataLimits[PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY]
		) {
			this.data = [...this.data.slice(1), item];
		} else {
			this.data = [...this.data, item];
		}
	};

	@action
	public deleteHistoryItem = (item: GraphSearchResult) => {
		if (!this.data) {
			return;
		}
		this.data = this.data.filter(existedItem => existedItem.id !== item.id);
	};
}
