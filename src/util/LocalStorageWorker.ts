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

enum LocalStorageLegacyEntities {
	PINNED_MESSAGES = 'pinnedMessages',
	EVENTS = 'events',
	SEARCH_HISTORY = 'search-history',
	GRAPH_SEARCH_HISTORY = 'graph-search-history',
	DISPLAY_RULES = 'display-rules',
	ROOT_DISPLAY_RULE = 'root-display-rule',
}

class LocalStorageWorker {
	public clearLocalStorageData = (): void => {
		localStorage.removeItem(LocalStorageLegacyEntities.ROOT_DISPLAY_RULE);
		localStorage.removeItem(LocalStorageLegacyEntities.DISPLAY_RULES);
		localStorage.removeItem(LocalStorageLegacyEntities.PINNED_MESSAGES);
		localStorage.removeItem(LocalStorageLegacyEntities.EVENTS);
		localStorage.removeItem(LocalStorageLegacyEntities.SEARCH_HISTORY);
		localStorage.removeItem(LocalStorageLegacyEntities.GRAPH_SEARCH_HISTORY);
	};

	public getDBVersion = (): number => {
		try {
			const version = localStorage.getItem('version');
			if (!version) {
				return 1;
			}
			return JSON.parse(version);
		} catch (error) {
			return 1;
		}
	};

	public addDBVersion = (): void => {
		const currVersion = this.getDBVersion();
		localStorage.setItem('version', JSON.stringify(currVersion + 1));
	};
}

const localStorageWorker = new LocalStorageWorker();

export default localStorageWorker;
