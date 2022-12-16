/** *****************************************************************************
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

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { observable, when } from 'mobx';
import { nanoid } from 'nanoid';
import { GraphSearchResult } from '../components/graph/search/GraphSearch';
import { MessageDisplayRule, MessageSortOrderItem } from '../models/EventMessage';
import { OrderRule } from '../stores/MessageDisplayRulesStore';
import { SearchHistory } from '../stores/SearchStore';
import { FiltersHistoryType } from '../stores/FiltersHistoryStore';
import { Session } from '../stores/messages/SessionsStore';
import { EventBookmark, MessageBookmark } from '../models/Bookmarks';
import { FilterState } from '../models/search/Search';
import notificationsStore from '../stores/NotificationsStore';

export enum IndexedDbStores {
	EVENTS = 'events',
	MESSAGES = 'messages',
	SEARCH_HISTORY = 'search-history',
	GRAPH_SEARCH_HISTORY = 'graph-search-history',
	DISPLAY_RULES = 'display-rules',
	MESSAGE_BODY_SORT_ORDER = 'message-body-sort-order',
	FILTERS_HISTORY = 'filters-history',
	SESSIONS_HISTORY = 'sessions-history',
	SETTINGS = 'settings',
}

export type Settings = {
	timestamp: 0;
	interval: number;
};

type indexedDbStoresKeyPaths = {
	[k in IndexedDbStores]: string;
};

export type DbData =
	| EventBookmark
	| MessageBookmark
	| SearchHistory
	| GraphSearchResult
	| MessageDisplayRule
	| OrderRule
	| MessageSortOrderItem
	| FiltersHistoryType<FilterState>
	| Session
	| Settings;

interface TH2DB extends DBSchema {
	[IndexedDbStores.EVENTS]: {
		key: string;
		value: EventBookmark;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.MESSAGES]: {
		key: string;
		value: MessageBookmark;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.SEARCH_HISTORY]: {
		key: number;
		value: SearchHistory;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.GRAPH_SEARCH_HISTORY]: {
		key: string;
		value: GraphSearchResult;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.DISPLAY_RULES]: {
		key: string;
		value: MessageDisplayRule | OrderRule;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.MESSAGE_BODY_SORT_ORDER]: {
		key: string;
		value: MessageSortOrderItem;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.FILTERS_HISTORY]: {
		key: string;
		value: FiltersHistoryType<FilterState>;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.SESSIONS_HISTORY]: {
		key: string;
		value: Session;
		indexes: {
			timestamp: number;
		};
	};
	[IndexedDbStores.SETTINGS]: {
		key: string;
		value: Settings;
		indexes: {
			timestamp: number;
		};
	};
}

export const indexedDbLimits = {
	bookmarks: 1000,
	[IndexedDbStores.FILTERS_HISTORY]: 40,
	[IndexedDbStores.DISPLAY_RULES]: 100,
	[IndexedDbStores.MESSAGE_BODY_SORT_ORDER]: 100,
	[IndexedDbStores.SEARCH_HISTORY]: 5,
	[IndexedDbStores.GRAPH_SEARCH_HISTORY]: 1000,
	[IndexedDbStores.SESSIONS_HISTORY]: 20,
} as const;

const indexedDBkeyPaths: indexedDbStoresKeyPaths = {
	[IndexedDbStores.EVENTS]: 'id',
	[IndexedDbStores.MESSAGES]: 'id',
	[IndexedDbStores.SEARCH_HISTORY]: 'timestamp',
	[IndexedDbStores.GRAPH_SEARCH_HISTORY]: 'id',
	[IndexedDbStores.DISPLAY_RULES]: 'id',
	[IndexedDbStores.MESSAGE_BODY_SORT_ORDER]: 'id',
	[IndexedDbStores.FILTERS_HISTORY]: 'timestamp',
	[IndexedDbStores.SESSIONS_HISTORY]: 'session',
	[IndexedDbStores.SETTINGS]: 'timestamp',
};

const dbVersion = 4;

export class IndexedDB {
	@observable
	private error: Error | null = null;

	@observable
	private db: IDBPDatabase<TH2DB> | null = null;

	constructor(private env: string) {
		this.initDb();
	}

	private async initDb() {
		try {
			this.db = await openDB<TH2DB>(this.env, dbVersion, {
				upgrade: async db => {
					Object.entries(indexedDBkeyPaths).forEach(([storeName, keyPath]) => {
						const name = storeName as IndexedDbStores;
						if (!db.objectStoreNames.contains(name)) {
							const store = db.createObjectStore(name, { keyPath });
							store.createIndex('timestamp', 'timestamp');
						}
					});
				},
			});
		} catch (error) {
			this.error = new Error(String(error));
		}
	}

	public getError = () => this.error;

	private getDb = async (): Promise<IDBPDatabase<TH2DB>> => {
		if (this.db) return this.db;
		if (!this.db) {
			await when(() => this.db !== null);
		}
		return (this.db as unknown) as IDBPDatabase<TH2DB>;
	};

	public deleteDbStoreItem = async (storeName: IndexedDbStores, key: string | number) => {
		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);

		await store.delete(key);
		await tx.done;
	};

	public addDbStoreItem = async <T extends DbData>(storeName: IndexedDbStores, data: T) => {
		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);

		await store.add(data);
		await tx.done;
	};

	public updateDbStoreItem = async <T extends DbData>(storeName: IndexedDbStores, data: T) => {
		try {
			const db = await this.getDb();
			const tx = await db.transaction(storeName, 'readwrite');
			const store = await tx.objectStore(storeName);

			await store.put(data);
			await tx.done;
		} catch (error) {
			const id = nanoid();
			notificationsStore.addMessage({
				id,
				notificationType: 'genericError',
				header: 'Unable to store data to IndexedDB',
				type: 'error',
				action: {
					label: 'Clear IndexedDB',
					callback: () => {
						notificationsStore.deleteMessage(id);
						this.resetDatabse();
					},
				},
				description: 'Unable to store data to IndexedDB',
			});
		}
	};

	public getStoreValues = async <T extends DbData>(
		storeName: IndexedDbStores,
		query: {
			countLimit?: number;
			direction?: IDBCursorDirection;
		} = {},
	): Promise<T[]> => {
		const { direction = 'next', countLimit } = query;

		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readonly');

		let cursor = await tx.store.index('timestamp').openCursor(null, direction);

		const data: T[] = [];

		const limit = countLimit || Number.MAX_SAFE_INTEGER;

		while (cursor && data.length !== limit) {
			data.push(cursor.value as T);
			// eslint-disable-next-line no-await-in-loop
			cursor = await cursor.continue();
		}

		return (data as unknown) as Promise<T[]>;
	};

	public getStoreKeys = async <T extends IDBValidKey>(
		storeName: IndexedDbStores,
		query: {
			countLimit?: number;
			direction?: IDBCursorDirection;
		} = {},
	): Promise<T[]> => {
		const { direction = 'next', countLimit } = query;

		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readonly');

		let cursor = await tx.store.index('timestamp').openCursor(null, direction);

		const data: IDBValidKey[] = [];

		const limit = typeof countLimit === 'number' ? countLimit : Number.MAX_SAFE_INTEGER;

		while (cursor && data.length !== limit) {
			data.push(cursor.primaryKey);
			// eslint-disable-next-line no-await-in-loop
			cursor = await cursor.continue();
		}

		return (data as unknown) as Promise<T[]>;
	};

	public clearAllData = async () => {
		const db = await this.getDb();
		const stores = db.objectStoreNames;

		await Promise.all([...stores].map(store => this.clearStore(store)));
	};

	private clearStore = async (storeName: IndexedDbStores) => {
		const db = await this.getDb();

		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);
		if (store.clear) {
			store.clear();
		}
	};

	private resetDatabse = async () => {
		this.db?.close();
		const requestDelete = indexedDB.deleteDatabase(this.env);

		requestDelete.addEventListener('success', () => this.initDb());
	};
}
