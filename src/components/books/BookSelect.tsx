/** *****************************************************************************
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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { useBooksStore } from '../../hooks/useBooksStore';
import { useWorkspaces } from '../../hooks';
import '../../styles/books.scss';
import Select from '../util/Select';

const BookSelect = () => {
	const booksStore = useBooksStore();
	const workspacesStore = useWorkspaces();

	const [currentValue, setCurrentValue] = React.useState(
		booksStore.selectedBook ? booksStore.selectedBook.name : '',
	);

	const booksIds = computed(() =>
		booksStore.books.map(b => b.name).sort((a, b) => a.localeCompare(b)),
	).get();

	const onChange = (bookName: string) => {
		const book = booksStore.books.find(b => b.name === bookName);
		if (book) {
			booksStore.selectBook(book);
			workspacesStore.onSelectedBookChange(book);
			setCurrentValue(book.name);
		} else {
			setCurrentValue(booksStore.selectedBook.name);
		}
	};

	return (
		<div className='books-input'>
			<Select
				className='event-window-header__scope'
				options={booksIds}
				onChange={onChange}
				selected={currentValue}
			/>
		</div>
	);
};

export default observer(BookSelect);
