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

import clsx from 'clsx';
import { Virtuoso } from 'react-virtuoso';
import { formatTimestamp } from 'helpers/date';
import MessagesFilter from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { getItemId } from 'helpers/event';
import { isEventMessage } from 'helpers/message';
import { SearchResult } from '../stores/SearchStore';
import SearchPanelSeparator from './SearchPanelSeparator';
import { EventSearchResult, MessageSearchResult } from './SearchResultItem';

interface SearchPanelResultsProps {
	onResultClick: (searchResult: SearchResult, isNewWorkspace?: boolean) => void;
	onResultDelete: () => void;
	flattenedResult: (SearchResult | [number, number])[];
	filters: EventsFilter | MessagesFilter;
	timestamp: number;
	disabledRemove: boolean;
	showLoadMoreButton: boolean;
	loadMore: () => void;
	itemsInView?: Record<string, boolean>;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		flattenedResult,
		timestamp,
		onResultClick: onResultItemClick,
		onResultDelete,
		disabledRemove,
		loadMore,
		showLoadMoreButton,
		itemsInView = {},
	} = props;

	const isResultItemHighlighted = (result: SearchResult) => itemsInView[getItemId(result)];

	// TODO implement opening item in a new workspace

	const renderResult = (i: number, result: SearchResult | [number, number]) => {
		if (Array.isArray(result)) {
			return <SearchPanelSeparator prevElement={result[0]} nextElement={result[1]} />;
		}

		const rootClassName = clsx('search-result', { highlight: isResultItemHighlighted(result) });

		if (isEventMessage(result)) {
			return (
				<div className={rootClassName}>
					<MessageSearchResult message={result} onClick={onResultItemClick} />
				</div>
			);
		}
		return (
			<div className={rootClassName}>
				<EventSearchResult event={result as any} onClick={onResultItemClick as any} />
			</div>
		);
	};

	return (
		<div className='search-results'>
			<div className='search-results__header'>
				<p className='search-results__timestamp'>{formatTimestamp(timestamp)}</p>
				<button
					className='search-results__remove-btn'
					disabled={disabledRemove}
					onClick={onResultDelete}>
					<i />
				</button>
			</div>
			<div className='search-results__list'>
				<Virtuoso
					data={flattenedResult}
					className='search-results__virtuoso'
					style={{ height: '100%' }}
					components={{
						Footer: function SearchResultsFooter() {
							if (!showLoadMoreButton) return null;
							return (
								<button onClick={loadMore} className='search-results__load-more-button'>
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
