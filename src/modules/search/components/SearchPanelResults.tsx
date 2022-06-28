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

import { Virtuoso } from 'react-virtuoso';
import { formatTimestamp } from 'helpers/date';
import { getItemId } from 'helpers/event';
import { ActionType } from 'models/EventAction';
import { FilterEntry, SearchResult } from '../stores/SearchStore';
import SearchPanelSeparator from './SearchPanelSeparator';
import { EventFilterState, MessageFilterState } from '../models/Search';
import SearchResultItem from './SearchResultItem';

interface SearchPanelResultsProps {
	onResultClick: (
		searchResult: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; entry: FilterEntry },
	) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultDelete: () => void;
	flattenedResult: (SearchResult | [number, number])[];
	filters: EventFilterState | MessageFilterState;
	timestamp: number;
	disabledRemove: boolean;
	showLoadMoreButton: boolean;
	loadMore: () => void;
	itemsInView?: Record<string, boolean>;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		flattenedResult,
		filters,
		timestamp,
		onResultClick: onResultItemClick,
		onResultDelete,
		disabledRemove,
		loadMore,
		showLoadMoreButton,
		itemsInView = {},
	} = props;

	const isResultItemHighlighted = (result: SearchResult) => itemsInView[getItemId(result)];

	const renderResult = (index: number, result: SearchResult | [number, number]) => {
		if (Array.isArray(result)) {
			return <SearchPanelSeparator prevElement={result[0]} nextElement={result[1]} />;
		}
		return (
			<SearchResultItem
				result={result}
				filters={filters}
				onResultClick={onResultItemClick}
				highlighted={isResultItemHighlighted(result)}
			/>
		);
	};

	return (
		<div className='search-results'>
			<div className='history-point'>
				<p className='history-point__timestamp'>{formatTimestamp(timestamp)}</p>
				<button
					className='bookmark-item__remove-btn'
					disabled={disabledRemove}
					onClick={onResultDelete}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			</div>
			<div className='search-results__list'>
				<Virtuoso
					data={flattenedResult}
					className={'search-results__list-virtual'}
					style={{ height: '100%' }}
					components={{
						Footer: function SearchResultsFooter() {
							if (!showLoadMoreButton) return null;
							return (
								<button onClick={loadMore} className='actions-list__load-button'>
									Load more
								</button>
							);
						},
					}}
					itemContent={renderResult}
				/>
			</div>
		</div>
	);
};

export default SearchPanelResults;
