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
import { useActivePanel } from 'hooks/index';
import { EventTreeNode, EventAction } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import { Panel } from 'models/Panel';
import { useBookmarksFilterStore } from '../hooks/useBookmarkFilterStore';
import { useBookmarksStore } from '../hooks/useBookmarksStore';
import { EventBookmarkComponent, MessageBookmarkComponent } from './BookmarkItem';
import { BookmarkFilters } from './BookmarkFilters';
import { BookmarkList } from './BookmarkList';
import { Bookmark } from '../models/Bookmarks';
import { isEventBookmark, isMessageBookmark } from '../helpers/bookmarks';
import 'styles/bookmarks.scss';

interface BookmarkPanelProps {
	onBookmarkClick: (savedItem: EventAction | EventMessage | EventTreeNode) => void;
}

function BookmarksPanel(props: BookmarkPanelProps) {
	const { isEmpty } = useBookmarksStore();

	const filterStore = useBookmarksFilterStore();

	const { ref: panelRef } = useActivePanel(Panel.Bookmarks);

	function onBookmarkClick(bookmark: Bookmark) {
		props.onBookmarkClick(bookmark.item);
	}

	function renderBookmarkItem(index: number, bookmark: Bookmark) {
		if (isMessageBookmark(bookmark)) {
			return (
				<div className='bookmarks-panel__list-item'>
					<MessageBookmarkComponent bookmark={bookmark} onClick={onBookmarkClick} />
				</div>
			);
		}
		if (isEventBookmark(bookmark)) {
			return (
				<div className='bookmarks-panel__list-item'>
					<EventBookmarkComponent bookmark={bookmark} onClick={onBookmarkClick} />
				</div>
			);
		}
		return null;
	}

	return (
		<div className='window bookmarks-panel' ref={panelRef}>
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
