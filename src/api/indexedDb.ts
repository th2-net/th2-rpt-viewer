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
import moment from 'moment';
import { getItemId } from '../helpers/event';
import { notEmpty } from '../helpers/object';
import { GraphSearchResult } from '../components/graph/search/GraphSearch';
import notificationsStore from '../stores/NotificationsStore';
import { ROOT_DISPLAY_NAME_ID } from '../stores/MessageDisplayRulesStore';
import localStorageWorker from '../util/LocalStorageWorker';

const dbName = 'th2-db';
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

	constructor() {
		this.initDb();
	}

	private async initDb() {
		this.db = await openDB(dbName, dbVersion, {
			async upgrade(db, oldVersion, newVersion) {
				// Migrate data from localStorage
				if (oldVersion === 0 && newVersion === 1) {
					const events = localStorageWorker.getPersistedPinnedEvents();
					const messages = localStorageWorker.getPersistedPinnedMessages();
					const searchHistory = localStorageWorker.getSearchHistory();
					const displayRules = localStorageWorker.getMessageDisplayRules();
					const rootDisplayRule = localStorageWorker.getRootDisplayRule();
					const graphSearchHistory: GraphSearchResult[] = localStorageWorker
						.getGraphSearchHistory()
						.map(searchItem => ({
							item: searchItem,
							id: getItemId(searchItem),
							searchTimestamp: moment.utc().valueOf(),
						}));

					if (rootDisplayRule) {
						rootDisplayRule.id = ROOT_DISPLAY_NAME_ID;
					}
					const messageDisplayRules = [rootDisplayRule, ...displayRules].filter(notEmpty);

					const eventsStore = db.createObjectStore(IndexedDbStores.EVENTS, { keyPath: 'eventId' });
					const messagesStore = db.createObjectStore(IndexedDbStores.MESSAGES, {
						keyPath: 'messageId',
					});
					const searchHistoryStore = db.createObjectStore(IndexedDbStores.SEARCH_HISTORY, {
						keyPath: 'timestamp',
					});
					const graphSearchHistoryStore = db.createObjectStore(
						IndexedDbStores.GRAPH_SEARCH_HISTORY,
						{
							keyPath: 'id',
						},
					);
					const displayRulesStore = db.createObjectStore(IndexedDbStores.DISPLAY_RULES, {
						keyPath: 'id',
					});

					await Promise.all([
						Promise.all(events.map(event => eventsStore.put(event))),
						Promise.all(messages.map(message => messagesStore.put(message))),
						Promise.all(
							searchHistory.map(searchHistoryItem => searchHistoryStore.put(searchHistoryItem)),
						),
						Promise.all(messageDisplayRules.map(displayRule => displayRulesStore.put(displayRule))),
						Promise.all(
							graphSearchHistory.map(searchItem => graphSearchHistoryStore.put(searchItem)),
						),
					]);

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
			description: 'Storage quota exceeded. Try delete old data',
			action: data,
		});
	};
}
