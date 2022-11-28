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

import { observer } from 'mobx-react-lite';
import { Button } from 'components/buttons/Button';
import { useBookmarksStore } from '../hooks/useBookmarksStore';
import { useBookmarksFilterStore } from '../hooks/useBookmarkFilterStore';
import BookmarkTextSearch from './BookmarkTextSearch';
import BookmarkTypeSwitcher from './BookmarkTypeSwitcher';
import 'styles/bookmarks.scss';

export function BookmarkFiltersBase() {
	const bookmarkStore = useBookmarksStore();
	const filterStore = useBookmarksFilterStore();

	return (
		<div className='window__controls bookmark-panel-header'>
			<BookmarkTextSearch
				value={filterStore.search}
				setValue={filterStore.setSearch}
				label='Search'
			/>
			<div className='bookmark-panel-header__row'>
				<BookmarkTypeSwitcher
					value={filterStore.bookmarkType}
					setValue={filterStore.setBookmarkType}
					label='Type'
				/>
				<div>
					<div>
						<Button
							variant='contained'
							disabled={filterStore.selectedBookmarks.size === 0}
							onClick={bookmarkStore.removeSelected}>
							Delete
							{filterStore.selectedBookmarks.size > 0 && ` (${filterStore.selectedBookmarks.size})`}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

export const BookmarkFilters = observer(BookmarkFiltersBase);
