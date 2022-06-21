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

import { action, computed, observable } from 'mobx';
import { getItemId, getItemName } from 'helpers/event';
import { isEventBookmark, isMessageBookmark } from '../helpers/bookmarks';
import { Bookmark, BookmarkType } from '../models/Bookmarks';
import { BookmarksStore } from './BookmarksStore';

export class BookmarksFilterStore {
	constructor(private bookmarkStore: BookmarksStore) {}

	@observable
	public bookmarkType: BookmarkType | null = null;

	@observable
	public search = '';

	@observable
	public selectedBookmarks: Set<string> = new Set();

	@computed
	public get isAllSelected() {
		return (
			this.bookmarkStore.bookmarks.length > 0 &&
			this.bookmarkStore.bookmarks.length === this.selectedBookmarks.size
		);
	}

	@computed
	public get filteredBookmarks() {
		const regex = new RegExp(this.search, 'ig');
		return this.bookmarkStore.bookmarks
			.filter(
				bookmark =>
					this.bookmarkType === null ||
					(this.bookmarkType === 'event' && isEventBookmark(bookmark)) ||
					(this.bookmarkType === 'message' && isMessageBookmark(bookmark)),
			)
			.filter(
				bookmark => regex.test(getItemId(bookmark.item)) || regex.test(getItemName(bookmark.item)),
			);
	}

	@action
	public setBookmarkType = (type: BookmarkType | null) => {
		this.selectedBookmarks.clear();
		this.bookmarkType = type;
	};

	@action
	public setSearch = (v: string) => {
		this.selectedBookmarks.clear();
		this.search = v;
	};

	@action
	public selectItem = (bookmark: Bookmark) => {
		const id = bookmark.id;
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
	public resetSelection = () => {
		this.selectedBookmarks = new Set();
	};
}
