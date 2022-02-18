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

import { observable, reaction, runInAction } from 'mobx';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import { IndexedDB, IndexedDbStores } from '../../api/indexedDb';
import {
	PersistedDataCollectionsNames,
	PersistedDataIDs,
	PersistedDataTypes,
} from '../../models/PersistedData';
import MessageDisplayRulesStore, { DEFAULT_ROOT_RULE } from './MessageDisplayRulesStore';
import FiltersHistoryStore from './FiltersHistoryStore';
import GraphSearchHistoryStore from './GraphSearchHistoryStore';
import LastSearchedSessionsStore from './LastSearchedSessionsStore';
import MessageBodySortStore from './MessageBodySortStore';
import PinnedItemsStore from './PinnedItemsStore';
import SearchHistoryStore from './SearchHistoryStore';

export interface RootDataIDs {
	timestamp: number;
	ids: PersistedDataIDs;
}

export default class PersistedDataRootStore {
	public lastSearchedSessions!: LastSearchedSessionsStore;

	public messageDisplayRules!: MessageDisplayRulesStore;

	public graphSearchHistory!: GraphSearchHistoryStore;

	public messageBodySort!: MessageBodySortStore;

	public filtersHistory!: FiltersHistoryStore;

	public searchHistory!: SearchHistoryStore;

	public pinnedItems!: PinnedItemsStore;

	constructor(private indexedDB: IndexedDB, private api: PersistedDataApiSchema) {
		this.init();
		reaction(() => this.rootDataIDs?.ids, this.initStores);
	}

	@observable
	public initialized = false;

	@observable
	public rootDataIDs: RootDataIDs | null = null;

	private init = async () => {
		let savedRootDataIDs = (
			await this.indexedDB.getStoreValues<RootDataIDs>(IndexedDbStores.ROOT_DATA_IDS)
		)[0];

		if (!savedRootDataIDs) {
			try {
				const promisedDataIDs = Object.values(PersistedDataCollectionsNames).map(collection =>
					this.api.setPersistedData<PersistedDataTypes[PersistedDataCollectionsNames]>(
						collection,
						collection === PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES
							? { rootRule: DEFAULT_ROOT_RULE, rules: [] }
							: [],
					),
				);

				const dataIds: [PersistedDataCollectionsNames, string][] = await Promise.all(
					promisedDataIDs,
				);

				const newRootDataID: RootDataIDs = {
					timestamp: Date.now(),
					ids: Object.fromEntries(dataIds) as PersistedDataIDs,
				};

				await this.indexedDB.addDbStoreItem(IndexedDbStores.ROOT_DATA_IDS, newRootDataID);
				savedRootDataIDs = newRootDataID;
			} catch (error) {
				console.error(error);
			}
		}
		runInAction(() => {
			this.rootDataIDs = savedRootDataIDs;
		});
	};

	private initStores = (ids?: PersistedDataIDs) => {
		if (!ids) {
			console.error('Unable to load persisted data!');
			return;
		}

		this.lastSearchedSessions = new LastSearchedSessionsStore(
			ids[PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS],
			this.api,
		);

		this.messageDisplayRules = new MessageDisplayRulesStore(
			ids[PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES],
			this.api,
		);

		this.graphSearchHistory = new GraphSearchHistoryStore(
			ids[PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY],
			this.api,
		);

		this.messageBodySort = new MessageBodySortStore(
			ids[PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER],
			this.api,
		);

		this.filtersHistory = new FiltersHistoryStore(
			ids[PersistedDataCollectionsNames.FILTERS_HISTORY],
			this.api,
		);

		this.searchHistory = new SearchHistoryStore(
			ids[PersistedDataCollectionsNames.SEARCH_HISTORY],
			this.api,
		);

		this.pinnedItems = new PinnedItemsStore(
			ids[PersistedDataCollectionsNames.PINNED_ITEMS],
			this.api,
		);

		this.initialized = true;
	};
}
