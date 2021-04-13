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

import { openDB, IDBPDatabase } from 'idb';
import { observable, when } from 'mobx';
import notificationsStore from '../stores/NotificationsStore';
import localStorageWorker from '../util/LocalStorageWorker';

const dbVersion = 1;

export enum IndexedDbStores {
	EVENTS = 'events',
	MESSAGES = 'messages',
	SEARCH_HISTORY = 'search-history',
	GRAPH_SEARCH_HISTORY = 'graph-search-history',
	DISPLAY_RULES = 'display-rules',
}

export class IndexedDB {
	@observable
	private db: IDBPDatabase<IndexedDbStores> | null = null;

	constructor(private env: string) {
		this.initDb();
	}

	private async initDb() {
		this.db = await openDB(this.env, dbVersion, {
			async upgrade(db, oldVersion, newVersion) {
				// Migrate data from localStorage
				if (oldVersion === 0 && newVersion === 1) {
					db.createObjectStore(IndexedDbStores.EVENTS, { keyPath: 'id' });
					db.createObjectStore(IndexedDbStores.MESSAGES, {
						keyPath: 'id',
					});
					db.createObjectStore(IndexedDbStores.SEARCH_HISTORY, {
						keyPath: 'timestamp',
					});
					db.createObjectStore(IndexedDbStores.GRAPH_SEARCH_HISTORY, {
						keyPath: 'id',
					});
					db.createObjectStore(IndexedDbStores.DISPLAY_RULES, {
						keyPath: 'id',
					});
					localStorageWorker.clearLocalStorageData();
				}
			},
		});
	}

	private getDb = async (): Promise<IDBPDatabase<IndexedDbStores>> => {
		if (this.db) return this.db;
		if (!this.db) {
			await when(() => this.db !== null);
		}
		return (this.db as unknown) as IDBPDatabase<IndexedDbStores>;
	};

	public deleteDbStoreItem = async (storeName: IndexedDbStores, key: string | number) => {
		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);

		await store.delete(key);
		await tx.done;
	};

	public addDbStoreItem = async <T>(storeName: IndexedDbStores, data: T) => {
		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);

		try {
			await store.add(data);
			await tx.done;
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.handleQuotaExceededError(data);
			}
		}
	};

	public updateDbStoreItem = async <T>(storeName: IndexedDbStores, data: T) => {
		const db = await this.getDb();
		const tx = await db.transaction(storeName, 'readwrite');
		const store = await tx.objectStore(storeName);

		try {
			await store.put(data);
			await tx.done;
		} catch (error) {
			if (error.name === 'QuotaExceededError') {
				this.handleQuotaExceededError(data);
			}
		}
	};

	public getStoreValues = async <T>(storeName: IndexedDbStores): Promise<T[]> => {
		const db = await this.getDb();

		const tx = await db.transaction(storeName, 'readonly');
		const store = await tx.objectStore(storeName);

		const values = store.getAll();

		return values as Promise<T[]>;
	};

	private handleQuotaExceededError = (data: unknown) => {
		notificationsStore.addError({
			errorType: 'indexedDbError',
			type: 'error',
			header: 'QuotaExceededError',
			description: 'Storage quota exceeded. Try to delete old data',
			action: data,
		});
	};
}
