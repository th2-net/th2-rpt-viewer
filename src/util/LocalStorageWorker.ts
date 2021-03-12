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
import { SearchHistory } from '../stores/SearchStore';

enum LocalStorageEntities {
	PINNED_MESSAGES = 'pinnedMessages',
	EVENTS = 'events',
	SEARCH_HISTORY = 'search-history',
	GRAPH_SEARCH_HISTORY = 'graph-search-history',
	DISPLAY_RULES = 'display-rules',
	ROOT_DISPLAY_RULE = 'root-display-rule',
}
class LocalStorageWorker {
	getPersistedPinnedMessages(): EventMessage[] {
		try {
			const pinnedMessages = localStorage.getItem(LocalStorageEntities.PINNED_MESSAGES);
			const parsedMessages = pinnedMessages ? JSON.parse(pinnedMessages) : [];
			return Array.isArray(parsedMessages) ? parsedMessages.filter(isMessage) : [];
		} catch (error) {
			return [];
		}
	}

	getPersistedPinnedEvents(): EventTreeNode[] {
		try {
			const pinnedEventsNodes = localStorage.getItem(LocalStorageEntities.EVENTS);
			const parsedEventNodes = pinnedEventsNodes ? JSON.parse(pinnedEventsNodes) : [];
			return Array.isArray(parsedEventNodes) ? parsedEventNodes.filter(isEventNode) : [];
		} catch (error) {
			return [];
		}
	}

	setPersistedPinnedMessages(pinnedMessages: EventMessage[]) {
		localStorage.setItem(LocalStorageEntities.PINNED_MESSAGES, JSON.stringify(pinnedMessages));
	}

	setPersistedPinnedEvents(pinnedEvents: EventTreeNode[]) {
		localStorage.setItem(LocalStorageEntities.EVENTS, JSON.stringify(pinnedEvents));
	}

	saveSearchHistory = (history: SearchHistory[]) => {
		localStorage.setItem(LocalStorageEntities.SEARCH_HISTORY, JSON.stringify(history));
	};

	saveGraphSearchHistory = (history: Array<EventMessage | EventAction>) => {
		localStorage.setItem(LocalStorageEntities.GRAPH_SEARCH_HISTORY, JSON.stringify(history));
	};

	getSearchHistory = () => {
		try {
			const searchHistory = localStorage.getItem(LocalStorageEntities.SEARCH_HISTORY);
			const parsedSearchHistory = searchHistory ? JSON.parse(searchHistory) : [];
			return Array.isArray(parsedSearchHistory)
				? parsedSearchHistory.filter(isSearchHistoryEntity)
				: [];
		} catch (error) {
			return [];
		}
	};

	getGraphSearchHistory = (): Array<EventMessage | EventAction> => {
		try {
			const graphSearchHistory = localStorage.getItem(LocalStorageEntities.GRAPH_SEARCH_HISTORY);
			return graphSearchHistory ? JSON.parse(graphSearchHistory) : [];
		} catch (error) {
			return [];
		}
	};

	getRootDisplayRule = (): MessageDisplayRule | null => {
		try {
			const rootRule = localStorage.getItem(LocalStorageEntities.ROOT_DISPLAY_RULE);
			return rootRule ? JSON.parse(rootRule) : null;
		} catch (error) {
			return null;
		}
	};

	setRootDisplayRule = (rules: MessageDisplayRule) => {
		localStorage.setItem(LocalStorageEntities.ROOT_DISPLAY_RULE, JSON.stringify(rules));
	};

	getMessageDisplayRules = (): Array<MessageDisplayRule> => {
		try {
			const displayRules = localStorage.getItem(LocalStorageEntities.DISPLAY_RULES);
			return displayRules ? JSON.parse(displayRules) : [];
		} catch (error) {
			return [];
		}
	};

	setMessageDisplayRules = (rules: Array<MessageDisplayRule>) => {
		localStorage.setItem(LocalStorageEntities.DISPLAY_RULES, JSON.stringify(rules));
	};
}

const localStorageWorker = new LocalStorageWorker();

export default localStorageWorker;
