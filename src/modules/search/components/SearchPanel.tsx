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

import { useLayoutEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useActivePanel } from 'hooks/index';
import { Panel } from 'models/Panel';
import SearchPanelForm from './SearchPanelForm';
import { useSearchStore } from '../hooks/useSearchStore';
import SearchPanelResults from './SearchPanelResults';
import { SearchResultItem } from '../stores/SearchStore';
import { SearchProgress } from './SearchProgress';
import 'styles/search-panel.scss';

interface SearchPanelProps {
	onResultClick: (searchResult: SearchResultItem) => void;
	itemsInView?: Record<string, boolean>;
}

const SearchPanel = (props: SearchPanelProps) => {
	const searchStore = useSearchStore();
	const { ref: searchPanelRef } = useActivePanel(Panel.Search);

	const scrolledId = useRef<number | null>(null);

	useLayoutEffect(() => {
		const search = searchStore.currentSearch;

		if (search && searchPanelRef.current) {
			if (
				search.timestamp !== searchStore.initialSearchId &&
				search.data.length > 0 &&
				scrolledId.current !== search.timestamp
			) {
				searchPanelRef.current.scrollTo({
					top: searchPanelRef.current.scrollHeight,
					behavior: 'smooth',
				});
				scrolledId.current = search.timestamp;
			}
		}
	}, [searchStore.currentSearch?.data]);

	return (
		<div className='search-panel window' ref={searchPanelRef}>
			<SearchPanelForm />
			<SearchProgress search={searchStore.currentSearch} />
			{searchStore.currentSearch && (
				<SearchPanelResults
					data={searchStore.currentSearch.data}
					disabledRemove={searchStore.isSearching}
					itemsInView={props.itemsInView}
					onResultClick={props.onResultClick}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);