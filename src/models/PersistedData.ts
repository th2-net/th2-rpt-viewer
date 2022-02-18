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

import { GraphSearchResult } from '../components/graph/search/GraphSearch';
import { FilterState } from '../components/search-panel/SearchPanelFilters';
import { FiltersHistoryType } from '../stores/FiltersHistoryStore';
import { Session } from '../stores/persisted/LastSearchedSessionsStore';
import { EventBookmark, MessageBookmark } from '../stores/persisted/PinnedItemsStore';
import { SearchHistory } from '../stores/SearchStore';
import { MessageDisplayRule } from './EventMessage';

export enum PersistedDataCollectionsNames {
	MESSAGE_BODY_SORT_ORDER = 'rptViewerMessageBodySortOrder',
	LAST_SEARCHED_SESSIONS = 'rptViewerLastSearchedSessions',
	MESSAGE_DISPLAY_RULES = 'rptViewerMessageDisplayRules',
	GRAPH_SEARCH_HISTORY = 'rptViewerGraphSearchHistory',
	FILTERS_HISTORY = 'rptViewerFiltesHistory',
	SEARCH_HISTORY = 'rptViewerSearchHistory',
	PINNED_ITEMS = 'rptViewerPinnedItems',
}

export type PersistedDataIDs = {
	[key in PersistedDataCollectionsNames]: string;
};

export const persistedDataLimits = {
	[PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER]: 100,
	[PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS]: 20,
	[PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES]: 100,
	[PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY]: 1000,
	[PersistedDataCollectionsNames.FILTERS_HISTORY]: 40,
	[PersistedDataCollectionsNames.SEARCH_HISTORY]: 5,
	[PersistedDataCollectionsNames.PINNED_ITEMS]: 1000,
};

export interface PersistedDataTypes {
	[PersistedDataCollectionsNames.MESSAGE_BODY_SORT_ORDER]: string[];
	[PersistedDataCollectionsNames.LAST_SEARCHED_SESSIONS]: Session[];
	[PersistedDataCollectionsNames.MESSAGE_DISPLAY_RULES]: {
		rootRule: MessageDisplayRule;
		rules: MessageDisplayRule[];
	};
	[PersistedDataCollectionsNames.GRAPH_SEARCH_HISTORY]: GraphSearchResult[];
	[PersistedDataCollectionsNames.FILTERS_HISTORY]: FiltersHistoryType<FilterState>[];
	[PersistedDataCollectionsNames.SEARCH_HISTORY]: SearchHistory[];
	[PersistedDataCollectionsNames.PINNED_ITEMS]: Array<EventBookmark | MessageBookmark>;
}
