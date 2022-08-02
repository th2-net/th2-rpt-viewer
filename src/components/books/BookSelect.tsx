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
import AutocompleteInput from '../util/AutocompleteInput';
import '../../styles/books.scss';

const BookSelect = () => {
	const booksStore = useBooksStore();
	const workspacesStore = useWorkspaces();

	const inputRef = React.useRef<HTMLInputElement>(null);

	const [currentValue, setCurrentValue] = React.useState(
		booksStore.selectedBook ? booksStore.selectedBook.name : '',
	);

	const booksIds = computed(() => booksStore.books.map(b => b.name)).get();

	const onSubmit = (bookName: string) => {
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
			<AutocompleteInput
				onSubmit={onSubmit}
				value={currentValue}
				setValue={setCurrentValue}
				autoCompleteList={booksIds}
				ref={inputRef}
				anchor={inputRef.current || undefined}
				autoresize={false}
				submitKeyCodes={[]}
				autocompleteListMinWidth={320}
			/>
		</div>
	);
};

export default observer(BookSelect);
