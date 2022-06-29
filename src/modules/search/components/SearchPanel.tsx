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
import { ActionType } from 'models/EventAction';
import SearchPanelForm from './SearchPanelForm';
import { useSearchStore } from '../hooks/useSearchStore';
import SearchPanelResults from './SearchPanelResults';
import { SearchResult, FilterEntry } from '../stores/SearchStore';
import 'styles/search-panel.scss';

interface SearchPanelProps {
	onResultClick: (
		searchResult: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; entry: FilterEntry },
	) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	itemsInView?: Record<string, boolean>;
}

const SearchPanel = (props: SearchPanelProps) => {
	const searchStore = useSearchStore();
	const { ref: searchPanelRef } = useActivePanel(null);

	const removeCurrentSearch = useCallback(() => {
		if (searchStore.currentSearch) {
			searchStore.deleteHistoryItem(searchStore.currentSearch);
		}
	}, [searchStore.currentSearch]);

	return (
		<div className='search-panel' ref={searchPanelRef}>
			<SearchPanelForm />
			{searchStore.currentSearch && (
				<SearchPanelResults
					flattenedResult={searchStore.flattenedResult}
					filters={searchStore.currentSearch.request.filters}
					timestamp={searchStore.currentSearch.timestamp}
					disabledRemove={searchStore.isSearching}
					showLoadMoreButton={searchStore.isCompleted && !searchStore.isHistorySearch}
					loadMore={searchStore.loadMore}
					onResultDelete={removeCurrentSearch}
					itemsInView={props.itemsInView}
					onResultClick={props.onResultClick}
					onResultGroupClick={props.onResultGroupClick}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);
