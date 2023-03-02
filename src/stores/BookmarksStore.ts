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

import { action, computed, observable, reaction, runInAction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import moment from 'moment';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './workspace/WorkspacesStore';
import { getItemId, getItemName } from '../helpers/event';
import { DbData, IndexedDB, indexedDbLimits, IndexedDbStores } from '../api/indexedDb';
import notificationsStore from './NotificationsStore';
import { Bookmark, BookmarkType, EventBookmark, MessageBookmark } from '../models/Bookmarks';
import { isEventBookmark, isMessageBookmark } from '../helpers/bookmarks';
import BooksStore from './BooksStore';
import { Book } from '../models/Books';

export class BookmarksStore {
	@observable.shallow
	public messages: MessageBookmark[] = [];

	@observable.shallow
	public events: EventBookmark[] = [];

	@observable
	public bookmarkType: BookmarkType | null = null;

	@observable
	public textSearch = '';

	@observable
	public selectedBookmarks: Set<string> = new Set();

	constructor(
		private workspacesStore: WorkspacesStore,
		private db: IndexedDB,
		private booksStore: BooksStore,
	) {
		reaction(
			() => this.bookmarkType,
			() => {
				this.selectedBookmarks.clear();
			},
		);
		reaction(
			() => this.textSearch,
			() => {
				this.selectedBookmarks.clear();
			},
		);

		reaction(() => this.booksStore.selectedBook, this.getBookmarks, { fireImmediately: true });
	}

	@computed
	public get sortedBookmarks() {
		const sortedBookmarks: Bookmark[] = [...this.messages, ...this.events];

		sortedBookmarks.sort((bookmarkA, bookmarkB) => {
			if (bookmarkA.timestamp > bookmarkB.timestamp) return -1;
			if (bookmarkA.timestamp < bookmarkB.timestamp) return 1;
			return 0;
		});
		return sortedBookmarks;
	}

	@computed
	public get filteredBookmarks() {
		const search = this.textSearch.toLowerCase();
		return this.sortedBookmarks
			.filter(
				bookmark =>
					this.bookmarkType === null ||
					(this.bookmarkType === 'event' && isEventBookmark(bookmark)) ||
					(this.bookmarkType === 'message' && isMessageBookmark(bookmark)),
			)
			.filter(
				bookmark =>
					getItemId(bookmark.item).toLowerCase().includes(search) ||
					getItemName(bookmark.item).toLowerCase().includes(search),
			);
	}

	@computed
	public get isBookmarksFull(): boolean {
		return this.messages.length + this.events.length >= indexedDbLimits.bookmarks;
	}

	@action
	public setBookmarkType = (type: BookmarkType | null) => {
		this.bookmarkType = type;
	};

	@action
	public setTextSearch = (v: string) => {
		this.textSearch = v;
	};

	@action
	public selectItem = (index: number) => {
		const id = this.filteredBookmarks[index].id;
		if (this.selectedBookmarks.has(id)) {
			this.selectedBookmarks.delete(id);
		} else {
			this.selectedBookmarks.add(id);
		}
	};

	@action
	public selectAll = () => {
		if (this.selectedBookmarks.size !== this.filteredBookmarks.length) {
			this.selectedBookmarks = new Set(this.filteredBookmarks.map(({ id }) => id));
		} else {
			this.selectedBookmarks.clear();
		}
	};

	@action
	public removeSelected = async () => {
		this.events.filter(({ id }) => this.selectedBookmarks.has(id)).forEach(this.removeBookmark);
		this.messages.filter(({ id }) => this.selectedBookmarks.has(id)).forEach(this.removeBookmark);
		this.events = this.events.filter(({ id }) => !this.selectedBookmarks.has(id));
		this.messages = this.messages.filter(({ id }) => !this.selectedBookmarks.has(id));
		this.selectedBookmarks.clear();
	};

	@action
	public toggleMessagePin = (message: EventMessage, bookId: string) => {
		const bookmark = this.messages.find(
			messageBookmark => messageBookmark.id === message.messageId,
		);
		if (bookmark) {
			this.removeBookmark(bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, bookmark.id);
		} else if (!this.isBookmarksFull) {
			const messageBookmark = this.createMessageBookmark(message, bookId);
			this.messages = this.messages.concat(messageBookmark);
			this.saveBookmark(toJS(messageBookmark));
		} else {
			this.onLimitReached();
		}
	};

	@action
	public toggleEventPin = async (event: EventTreeNode, bookId: string, scope: string) => {
		const bookmark = this.events.find(eventBookmark => eventBookmark.id === event.eventId);
		if (bookmark) {
			this.events = this.events.filter(eventBookmark => eventBookmark !== bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, bookmark.id);
		} else if (!this.isBookmarksFull) {
			const eventBookmark = this.createEventBookmark(event, bookId, scope);
			this.events = this.events.concat(eventBookmark);
			this.saveBookmark(toJS(eventBookmark));
		} else {
			this.onLimitReached();
		}
	};

	@action
	public removeBookmark = (bookmark: Bookmark) => {
		if (isEventBookmark(bookmark)) {
			this.events = this.events.filter(eventBookmark => eventBookmark !== bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, bookmark.id);
		}

		if (isMessageBookmark(bookmark)) {
			this.messages = this.messages.filter(messageBookmark => messageBookmark !== bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, bookmark.id);
		}
	};

	private saveBookmark = async (bookmark: EventBookmark | MessageBookmark) => {
		const store = isEventBookmark(bookmark) ? IndexedDbStores.EVENTS : IndexedDbStores.MESSAGES;
		try {
			await this.db.addDbStoreItem(store, toJS(bookmark));
		} catch (error: any) {
			if (error.name === 'QuotaExceededError') {
				this.workspacesStore.onQuotaExceededError(bookmark);
			} else {
				notificationsStore.addMessage({
					notificationType: 'genericError',
					type: 'error',
					header: `Failed to save bookmark ${getItemName(bookmark.item)}`,
					description: error instanceof Error ? error.message : `${error}`,
					id: nanoid(),
				});
			}
		}
	};

	private getSavedEvents = async (book: Book) => {
		try {
			const savedEvents = await this.db.getStoreValues<EventBookmark>(IndexedDbStores.EVENTS);
			runInAction(() => {
				this.events = savedEvents.filter(bookmark => bookmark.bookId === book.name);
			});
		} catch (error) {
			console.error('Failed to fetch saved events');
		}
	};

	private getSavedMessages = async (book: Book) => {
		try {
			const savedMessages = await this.db.getStoreValues<MessageBookmark>(IndexedDbStores.MESSAGES);
			runInAction(() => {
				this.messages = savedMessages.filter(bookmark => bookmark.bookId === book.name);
			});
		} catch (error) {
			console.error('Failed to fetch saved messages');
		}
	};

	private getBookmarks = (book: Book) => {
		this.events = [];
		this.messages = [];
		this.getSavedEvents(book);
		this.getSavedMessages(book);
	};

	private createMessageBookmark = (message: EventMessage, bookId: string): MessageBookmark => ({
		id: message.messageId,
		timestamp: moment.utc().valueOf(),
		item: toJS(message),
		bookId,
	});

	private createEventBookmark = (
		event: EventTreeNode,
		bookId: string,
		scope: string,
	): EventBookmark => ({
		id: event.eventId,
		timestamp: moment.utc().valueOf(),
		item: toJS(event),
		bookId,
		scope,
	});

	public syncData = async (unsavedData?: DbData) => {
		await Promise.all([
			this.getSavedEvents(this.booksStore.selectedBook),
			this.getSavedMessages(this.booksStore.selectedBook),
		]);

		if (isEventBookmark(unsavedData)) {
			await this.saveBookmark(unsavedData);
			this.events.push(unsavedData);
		}

		if (isMessageBookmark(unsavedData)) {
			await this.saveBookmark(unsavedData);
			this.messages.push(unsavedData);
		}
	};

	private onLimitReached = () => {
		notificationsStore.addMessage({
			notificationType: 'genericError',
			type: 'error',
			header: 'Limit reached',
			description: 'Maximum bookmarks limit reached. Delete old bookmarks',
			id: nanoid(),
		});
	};
}
