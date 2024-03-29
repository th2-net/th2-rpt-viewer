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
import React from 'react';
import { useActivePanel } from '../../hooks';
import SearchPanelForm from './SearchPanelForm';
import { useSearchStore } from '../../hooks/useSearchStore';
import SearchPanelResults from './SearchPanelResults';
import useSearchWorkspace from '../../hooks/useSearchWorkspace';
import { BookmarkedItem } from '../../models/Bookmarks';
import { isBookmark } from '../../helpers/bookmarks';
import '../../styles/search-panel.scss';

export type SearchPanelType = 'event' | 'message';

const SearchPanel = () => {
	const searchWorkspace = useSearchWorkspace();
	const searchStore = useSearchStore();

	const { ref: searchPanelRef } = useActivePanel(null);

	const onResultItemClick = React.useCallback(
		(bookmark: BookmarkedItem) => {
			if (isBookmark(bookmark)) {
				searchWorkspace.onSearchResultItemSelect(bookmark.item);
			} else {
				searchWorkspace.onSearchResultItemSelect(bookmark);
			}
		},
		[searchWorkspace.onSearchResultItemSelect],
	);

	return (
		<div className='search-panel-wrapper'>
			<div className='search-panel' ref={searchPanelRef}>
				<SearchPanelForm />
			</div>
			{searchStore.currentSearch && (
				<SearchPanelResults
					resultGroups={searchStore.sortedResultGroups}
					timestamp={searchStore.currentSearch.timestamp}
					onResultItemClick={onResultItemClick}
					onResultDelete={() => {
						if (searchStore.currentSearch) {
							searchStore.deleteHistoryItem(searchStore.currentSearch);
						}
					}}
					next={searchStore.nextSearch}
					prev={searchStore.prevSearch}
					currentIndex={searchStore.currentIndex}
					searchHistoryLength={searchStore.searchHistory.length}
					disableNext={
						searchStore.isSearching ||
						searchStore.currentIndex === searchStore.searchHistory.length - 1
					}
					disablePrev={searchStore.isSearching || searchStore.currentIndex === 0}
					disabledRemove={searchStore.isSearching}
					showLoadMoreButton={searchStore.isCompleted && !searchStore.isHistorySearch}
					loadMore={() => searchStore.startSearch(true)}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);
