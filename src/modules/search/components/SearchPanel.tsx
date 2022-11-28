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

import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useActivePanel } from 'hooks/index';
import { Panel } from 'models/Panel';
import SearchPanelForm from './SearchPanelForm';
import { useSearchStore } from '../hooks/useSearchStore';
import SearchPanelResults from './SearchPanelResults';
import { SearchResult } from '../stores/SearchStore';
import { SearchProgress } from './SearchProgress';
import 'styles/search-panel.scss';

interface SearchPanelProps {
	onResultClick: (searchResult: SearchResult) => void;
	itemsInView?: Record<string, boolean>;
}

const SearchPanel = (props: SearchPanelProps) => {
	const searchStore = useSearchStore();
	const { ref: searchPanelRef } = useActivePanel(Panel.Search);

	const removeCurrentSearch = useCallback(() => {
		if (searchStore.currentSearch) {
			searchStore.deleteHistoryItem(searchStore.currentSearch);
		}
	}, [searchStore.currentSearch]);

	const searchCount = searchStore.currentSearch ? searchStore.flattenedResult.length : 0;
	const limit = searchStore.currentSearch?.request.state.resultCountLimit;

	const progress = limit ? Math.min((searchCount / limit) * 100, 100) : null;

	// TODO: change progress calc from count to time

	return (
		<div className='search-panel window' ref={searchPanelRef}>
			<SearchPanelForm />
			{progress !== null && <SearchProgress progress={progress} searchCount={searchCount} />}
			{searchStore.currentSearch && (
				<SearchPanelResults
					flattenedResult={searchStore.flattenedResult}
					filters={searchStore.currentSearch.request.filters}
					disabledRemove={searchStore.isSearching}
					showLoadMoreButton={searchStore.isCompleted && !searchStore.isHistorySearch}
					loadMore={searchStore.loadMore}
					onResultDelete={removeCurrentSearch}
					itemsInView={props.itemsInView}
					onResultClick={props.onResultClick}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);
