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
import { createBemElement } from 'helpers/styleCreators';
import Checkbox from 'components/util/Checkbox';
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
			<BookmarkTypeSwitcher
				value={filterStore.bookmarkType}
				setValue={filterStore.setBookmarkType}
				label='Type'
			/>
			<div className='bookmark-panel-header-actions'>
				<div className='bookmark-panel-header-actions_left-side'>
					<button
						className='button'
						disabled={filterStore.selectedBookmarks.size === 0}
						onClick={bookmarkStore.removeSelected}>
						<i className={createBemElement('button', 'icon')} />
						<span className='button__label'>
							Delete
							{filterStore.selectedBookmarks.size > 0 && ` (${filterStore.selectedBookmarks.size})`}
						</span>
					</button>
				</div>
				<div className='bookmark-panel-header-actions_right-side'>
					<Checkbox
						className='bookmarks-panel-checkbox'
						checked={filterStore.isAllSelected}
						onChange={filterStore.selectAll}
					/>
				</div>
			</div>
		</div>
	);
}

export const BookmarkFilters = observer(BookmarkFiltersBase);
