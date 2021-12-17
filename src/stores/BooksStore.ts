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

import { action, observable, toJS } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { IndexedDbStores } from '../api/indexedDb';
import { Book } from '../models/Books';

export default class BooksStore {
	constructor(private api: ApiSchema, books: Book[], initialBook: Book) {
		this.books = books;
		this.selectedBook = initialBook;
	}

	@observable
	books: Book[] = [];

	@observable
	selectedBook: Book;

	@action
	selectBook = (book: Book) => {
		this.selectedBook = book;
		if (book) {
			this.api.indexedDb.updateDbStoreItem(
				IndexedDbStores.SELECTED_BOOK,
				toJS({
					...book,
					id: IndexedDbStores.SELECTED_BOOK,
					timestamp: Date.now(),
				}),
			);
		}
	};
}
