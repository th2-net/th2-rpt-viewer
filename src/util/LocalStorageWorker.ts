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

import { isEventNode } from '../helpers/event';
import { isMessage } from '../helpers/message';
import { isSearchHistoryEntity } from '../helpers/search';
import { EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage, MessageDisplayRule } from '../models/EventMessage';

enum LocalStorageLegacyEntities {
	PINNED_MESSAGES = 'pinnedMessages',
	EVENTS = 'events',
	SEARCH_HISTORY = 'search-history',
	GRAPH_SEARCH_HISTORY = 'graph-search-history',
	DISPLAY_RULES = 'display-rules',
	ROOT_DISPLAY_RULE = 'root-display-rule',
}
class LocalStorageWorker {
	public getPersistedPinnedMessages(): EventMessage[] {
		try {
			const pinnedMessages = localStorage.getItem(LocalStorageLegacyEntities.PINNED_MESSAGES);
			const parsedMessages = pinnedMessages ? JSON.parse(pinnedMessages) : [];
			return Array.isArray(parsedMessages) ? parsedMessages.filter(isMessage) : [];
		} catch (error) {
			return [];
		}
	}

	public getPersistedPinnedEvents(): EventTreeNode[] {
		try {
			const pinnedEventsNodes = localStorage.getItem(LocalStorageLegacyEntities.EVENTS);
			const parsedEventNodes = pinnedEventsNodes ? JSON.parse(pinnedEventsNodes) : [];
			return Array.isArray(parsedEventNodes) ? parsedEventNodes.filter(isEventNode) : [];
		} catch (error) {
			return [];
		}
	}

	public getSearchHistory = () => {
		try {
			const searchHistory = localStorage.getItem(LocalStorageLegacyEntities.SEARCH_HISTORY);
			const parsedSearchHistory = searchHistory ? JSON.parse(searchHistory) : [];
			return Array.isArray(parsedSearchHistory)
				? parsedSearchHistory
						.filter(isSearchHistoryEntity)
						.filter(searchHistoryItem => !Array.isArray(searchHistoryItem.results))
				: [];
		} catch (error) {
			return [];
		}
	};

	public getMessageDisplayRules = (): Array<MessageDisplayRule> => {
		try {
			const displayRules = localStorage.getItem(LocalStorageLegacyEntities.DISPLAY_RULES);
			return displayRules ? JSON.parse(displayRules) : [];
		} catch (error) {
			return [];
		}
	};

	public getRootDisplayRule = (): MessageDisplayRule | null => {
		try {
			const rootRule = localStorage.getItem(LocalStorageLegacyEntities.ROOT_DISPLAY_RULE);
			return rootRule ? JSON.parse(rootRule) : null;
		} catch (error) {
			return null;
		}
	};

	public getGraphSearchHistory = (): Array<EventMessage | EventAction> => {
		try {
			const graphSearchHistory = localStorage.getItem(
				LocalStorageLegacyEntities.GRAPH_SEARCH_HISTORY,
			);
			return graphSearchHistory ? JSON.parse(graphSearchHistory) : [];
		} catch (error) {
			return [];
		}
	};

	public clearLocalStorageData = (): void => {
		localStorage.removeItem(LocalStorageLegacyEntities.ROOT_DISPLAY_RULE);
		localStorage.removeItem(LocalStorageLegacyEntities.DISPLAY_RULES);
		localStorage.removeItem(LocalStorageLegacyEntities.PINNED_MESSAGES);
		localStorage.removeItem(LocalStorageLegacyEntities.EVENTS);
		localStorage.removeItem(LocalStorageLegacyEntities.SEARCH_HISTORY);
		localStorage.removeItem(LocalStorageLegacyEntities.GRAPH_SEARCH_HISTORY);
	};
}

const localStorageWorker = new LocalStorageWorker();

export default localStorageWorker;
