/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { action, observable, runInAction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { IndexedDbStores } from '../api/indexedDb';
import { Book } from '../models/Books';

export default class BooksStore {
	constructor(private api: ApiSchema) {
		this.init();
	}

	@observable
	books: Book[] = [];

	@observable
	selectedBook: Book | null = null;

	@observable
	isLoading = false;

	loadBooksList = async () => {
		try {
			this.isLoading = true;
			const books = await this.api.books.getBooksList();

			if (!books.length) throw new Error('Empty books list was received');

			runInAction(() => {
				this.books = books;
			});
		} finally {
			this.isLoading = false;
		}
	};

	@action
	setSelectedBook = (book: Book) => {
		this.selectedBook = book;
		// this.api.indexedDb.addDbStoreItem(IndexedDbStores.SELECTED_BOOK, book);
	};

	private init = async () => {
		const [selectedBookDBObject] = await this.api.indexedDb.getStoreValues<Book>(
			IndexedDbStores.SELECTED_BOOK,
		);
		await this.loadBooksList();
		this.setSelectedBook(this.books[0]);
	};
}
