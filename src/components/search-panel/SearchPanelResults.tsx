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
import { Virtuoso } from 'react-virtuoso';
import moment from 'moment';
import { isEventNode } from '../../helpers/event';
import { BookmarkedItem, BookmarkItem } from '../BookmarksPanel';
import { SearchResult } from '../../stores/SearchStore';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: BookmarkedItem) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	results: Array<SearchResult>;
	timestamp: number;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		results,
		timestamp,
		onResultItemClick,
		onResultDelete,
		disablePrev,
		disableNext,
		showToggler,
		next,
		prev,
	} = props;

	function computeKey(index: number) {
		const item = results[index];

		return isEventNode(item) ? item.eventId : item.messageId;
	}

	function renderSearchResult(index: number) {
		return <BookmarkItem item={results[index]} onClick={onResultItemClick} />;
	}

	return (
		<div className='search-results'>
			{showToggler && (
				<div className='search-results__controls'>
					<button className='search-results__arrow' disabled={disablePrev} onClick={prev} />
					<button className='search-results__arrow next' disabled={disableNext} onClick={next} />
				</div>
			)}
			<div className='history-point'>
				<p className='history-point__timestamp'>
					{moment(+timestamp)
						.utc()
						.format('DD.MM.YYYY HH:mm:ss.SSS')}
				</p>
				<button className='bookmark-item__remove-btn' onClick={onResultDelete}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			</div>
			<Virtuoso
				className='search-results__list'
				totalCount={results.length}
				item={renderSearchResult}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
};

export default SearchPanelResults;
