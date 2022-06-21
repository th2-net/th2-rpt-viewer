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

import { Observer, observer } from 'mobx-react-lite';
import Checkbox from 'components/util/Checkbox';
import { useActivePanel, useWorkspaceStore } from 'hooks/index';
import { useBookmarksFilterStore } from '../hooks/useBookmarkFilterStore';
import { useBookmarksStore } from '../hooks/useBookmarksStore';
import { BookmarkItem } from './BookmarkItem';
import { BookmarkFilters } from './BookmarkFilters';
import { BookmarkList } from './BookmarkList';
import { Bookmark } from '../models/Bookmarks';
import 'styles/bookmarks.scss';

function BookmarksPanel() {
	const { isBookmarksFull, isEmpty } = useBookmarksStore();

	const filterStore = useBookmarksFilterStore();

	const workspaceStore = useWorkspaceStore();

	const { ref: panelRef } = useActivePanel(null);

	function onBookmarkClick(bookmark: Bookmark) {
		workspaceStore.onSavedItemSelect(bookmark.item);
	}

	function renderBookmarkItem(index: number, bookmark: Bookmark) {
		return (
			<Observer>
				{() => (
					<div className='bookmarks-panel-item'>
						<BookmarkItem
							bookmark={bookmark}
							onClick={onBookmarkClick}
							isBookmarkButtonDisabled={isBookmarksFull}
						/>
						<Checkbox
							className='bookmarks-panel-checkbox'
							checked={filterStore.selectedBookmarks.has(bookmark.id)}
							onChange={() => filterStore.selectItem(bookmark)}
						/>
					</div>
				)}
			</Observer>
		);
	}

	return (
		<div className='bookmarks-panel' ref={panelRef}>
			<BookmarkFilters />
			<BookmarkList
				isEmpty={isEmpty}
				renderBookmark={renderBookmarkItem}
				bookmarks={filterStore.filteredBookmarks}
			/>
		</div>
	);
}

export default observer(BookmarksPanel);
