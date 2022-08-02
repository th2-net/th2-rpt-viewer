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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { nanoid } from 'nanoid';
import RootStore from '../stores/RootStore';
import ApiSchema from '../api/ApiSchema';
import { Book } from '../models/Books';
import { IndexedDbStores } from '../api/indexedDb';
import BooksStore from '../stores/BooksStore';
import notificationsStore from '../stores/NotificationsStore';

const RootStoreContext = React.createContext<RootStore | null>(null);

export async function createRootStore(api: ApiSchema): Promise<RootStore> {
	let initialBook: Book | null | undefined;
	let books: Book[] = [];
	try {
		books = await api.books.getBooksList();
		const bookId = new URLSearchParams(window.location.search).get('bookId');
		initialBook = (bookId && books.length > 0 && books.find(b => b.name === bookId)) || null;

		if (books.length === 0) {
			notificationsStore.addMessage({
				header: `Failed to load books`,
				description: '',
				notificationType: 'genericError',
				id: nanoid(),
				type: 'error',
			});
		}

		if (bookId && !initialBook) {
			notificationsStore.addMessage({
				header: `Failed to load book ${bookId}`,
				description: '',
				notificationType: 'genericError',
				id: nanoid(),
				type: 'error',
			});
		}

		if (!initialBook) {
			const [lastSelectedBook] = await api.indexedDb.getStoreValues<Book>(
				IndexedDbStores.SELECTED_BOOK,
			);
			initialBook = lastSelectedBook && books.find(book => book.name === lastSelectedBook.name);
		}
		initialBook = initialBook || books[0];
	} catch (e) {
		if (!books.length) {
			notificationsStore.addMessage({
				header: 'Failed to load books',
				description: '',
				notificationType: 'genericError',
				id: nanoid(),
				type: 'error',
			});
		}
	}

	const booksStore = new BooksStore(api, books, initialBook || books[0]);

	const rootStore = new RootStore(api, booksStore);

	return rootStore;
}

export default RootStoreContext;
