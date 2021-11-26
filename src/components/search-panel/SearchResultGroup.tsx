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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { isEventMessage, isEventNode, getItemId } from '../../helpers/event';
import { useSelectedStore } from '../../hooks';
import { SearchResult } from '../../stores/SearchStore';
import { BookmarkedItem, BookmarkItem } from '../bookmarks/BookmarksPanel';

interface SearchResultGroup {
	result: SearchResult;
	onResultClick: (searchResult: BookmarkedItem) => void;
}

const SearchResultGroup = ({ result, onResultClick }: SearchResultGroup) => {
	const selectedStore = useSelectedStore();

	const getBookmarkToggler = (searchResult: SearchResult) => () => {
		if (isEventMessage(searchResult)) {
			selectedStore.toggleMessagePin(searchResult);
		} else {
			selectedStore.toggleEventPin(searchResult);
		}
	};

	const getIsToggled = (searchResult: SearchResult): boolean => {
		return Boolean(
			selectedStore.savedItems.find(savedItem => getItemId(savedItem) === getItemId(searchResult)),
		);
	};

	return (
		<div className='search-result-single-item'>
			<BookmarkItem
				key={isEventNode(result) ? result.eventId : result.messageId}
				bookmark={result}
				onClick={onResultClick}
				toggleBookmark={getBookmarkToggler(result)}
				isBookmarked={getIsToggled(result)}
				isBookmarkButtonDisabled={selectedStore.isBookmarksFull}
			/>
		</div>
	);
};

export default observer(SearchResultGroup);
