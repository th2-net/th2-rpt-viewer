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

import { action, computed, observable, runInAction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import moment from 'moment';
import WorkspacesStore from 'stores/workspace/WorkspacesStore';
import notificationsStore from 'stores/NotificationsStore';
import { EventAction } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import { IBookmarksStore } from 'models/Stores';
import { getItemId, getItemName } from 'helpers/event';
import { sortByTimestamp } from 'helpers/date';
import { isQuotaExceededError } from 'helpers/fetch';
import { DbData, IndexedDB, indexedDbLimits, IndexedDbStores } from 'api/indexedDb';
import { Bookmark, EventBookmark, MessageBookmark } from '../models/Bookmarks';
import { isEventBookmark, isMessageBookmark } from '../helpers/bookmarks';
import { BookmarksFilterStore } from './BookmarkFilterStore';

export class BookmarksStore implements IBookmarksStore {
	readonly BOOKMARKS_LIMIT = indexedDbLimits.bookmarks;

	@observable.shallow
	public messages: MessageBookmark[] = [];

	@observable.shallow
	public events: EventBookmark[] = [];

	@observable
	public isLoadingBookmarks = false;

	filterStore: BookmarksFilterStore;

	constructor(private workspacesStore: WorkspacesStore, private db: IndexedDB) {
		this.filterStore = new BookmarksFilterStore(this);

		this.getBookmarks();
	}

	@computed
	public get bookmarks() {
		return sortByTimestamp<Bookmark>([...this.messages, ...this.events]);
	}

	@computed
	public get isBookmarksFull(): boolean {
		return this.bookmarks.length >= indexedDbLimits.bookmarks;
	}

	@computed get isEmpty(): boolean {
		return this.bookmarks.length === 0 && !this.isLoadingBookmarks;
	}

	@action
	public removeSelected = async () => {
		const selectedBookmarks = this.filterStore.selectedBookmarks;
		this.bookmarks.filter(({ id }) => selectedBookmarks.has(id)).forEach(this.removeBookmark);
		this.events = this.events.filter(({ id }) => !selectedBookmarks.has(id));
		this.messages = this.messages.filter(({ id }) => !selectedBookmarks.has(id));
		this.filterStore.resetSelection();
	};

	@action
	public toggleMessagePin = (message: EventMessage) => {
		const bookmark = this.messages.find(messageBookmark => messageBookmark.id === message.id);
		if (bookmark) {
			this.removeBookmark(bookmark);
		} else if (!this.isBookmarksFull) {
			const messageBookmark = this.createBookmark(message);
			this.messages = this.messages.concat(messageBookmark);
			this.saveBookmark(messageBookmark);
		} else {
			this.onLimitReached();
		}
	};

	@action
	public toggleEventPin = async (event: EventAction) => {
		const bookmark = this.events.find(eventBookmark => eventBookmark.id === event.eventId);
		if (bookmark) {
			this.removeBookmark(bookmark);
		} else if (!this.isBookmarksFull) {
			const eventBookmark = this.createBookmark(event);
			this.events = this.events.concat(eventBookmark);
			this.saveBookmark(eventBookmark);
		} else {
			this.onLimitReached();
		}
	};

	@action
	private removeBookmark = (bookmark: Bookmark) => {
		if (isEventBookmark(bookmark)) {
			this.events = this.events.filter(eventBookmark => eventBookmark !== bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, bookmark.id);
		} else {
			this.messages = this.messages.filter(messageBookmark => messageBookmark !== bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, bookmark.id);
		}
	};

	private getBookmarks = async () => {
		try {
			runInAction(() => (this.isLoadingBookmarks = true));

			const [savedEvents, savedMessages] = await Promise.all([
				this.db.getStoreValues<EventBookmark>(IndexedDbStores.EVENTS),
				this.db.getStoreValues<MessageBookmark>(IndexedDbStores.MESSAGES),
			]);

			runInAction(() => {
				this.messages = savedMessages;
				this.events = savedEvents;
				this.isLoadingBookmarks = false;
			});
		} catch (error) {
			console.error('Failed to fetch saved events');
			runInAction(() => (this.isLoadingBookmarks = false));
		}
	};

	private saveBookmark = async (bookmark: EventBookmark | MessageBookmark) => {
		const store = isEventBookmark(bookmark) ? IndexedDbStores.EVENTS : IndexedDbStores.MESSAGES;
		try {
			await this.db.addDbStoreItem(store, toJS(bookmark));
		} catch (error) {
			if (isQuotaExceededError(error)) {
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

	private createBookmark = <T extends EventMessage | EventAction>(item: T): Bookmark<T> => ({
		id: getItemId(item),
		timestamp: moment.utc().valueOf(),
		item: toJS(item),
	});

	public syncData = async (unsavedData?: DbData) => {
		await this.getBookmarks();

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
