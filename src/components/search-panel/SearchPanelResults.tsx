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
import { getItemId, isEvent } from '../../helpers/event';
import { FilterEntry, SearchResult } from '../../stores/SearchStore';
import { ActionType } from '../../models/EventAction';
import SearchPanelSeparator from './SearchPanelSeparator';
import { EventFilterState, MessageFilterState } from './SearchPanelFilters';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../hooks';
import { EventMessage } from '../../models/EventMessage';
import SearchResultItem from './SearchResultItem';

interface SearchPanelResultsProps {
	onResultItemClick: (
		searchResult: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; entry: FilterEntry },
		isNewWorkspace?: boolean,
	) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultDelete: () => void;
	flattenedResult: (SearchResult | [number, number])[];
	filters: EventFilterState | MessageFilterState;
	timestamp: number;
	disabledRemove: boolean;
	showLoadMoreButton: boolean;
	loadMore: () => void;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		flattenedResult,
		filters,
		timestamp,
		onResultItemClick,
		onResultDelete,
		disabledRemove,
		loadMore,
	} = props;

	const messagesWorkspaceStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	function computeKey(index: number) {
		const results = flattenedResult[index];
		if ('length' in results) return results[0];
		return getItemId(results);
	}

	const isMessageVisibleInMessagePanel = (message: EventMessage) => {
		const visibleMessages = messagesDataStore.messages.slice(
			messagesWorkspaceStore.currentMessagesIndexesRange.startIndex,
			messagesWorkspaceStore.currentMessagesIndexesRange.endIndex + 1,
		);

		return visibleMessages.some(({ id }) => id === message.id);
	};

	const isResultItemHighlighted = (result: SearchResult) => {
		if (isEvent(result)) {
			return true; // TODO: implement events highlighting
		}

		return isMessageVisibleInMessagePanel(result);
	};

	const renderResult = (index: number, result: SearchResult | [number, number]) => {
		if ('length' in result) {
			return <SearchPanelSeparator prevElement={result[0]} nextElement={result[1]} />;
		}
		return (
			<SearchResultItem
				key={computeKey(index)}
				result={result}
				filters={filters}
				onResultClick={onResultItemClick}
				highlighted={isResultItemHighlighted(result)}
			/>
		);
	};

	const loadMoreButton = () =>
		!loadMoreButton ? null : (
			<button onClick={loadMore} className='actions-list__load-button'>
				Load more
			</button>
		);

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
					computeItemKey={computeKey}
					components={{
						Footer: loadMoreButton,
					}}
					itemContent={renderResult}
				/>
			</div>
		</div>
	);
};

export default SearchPanelResults;
