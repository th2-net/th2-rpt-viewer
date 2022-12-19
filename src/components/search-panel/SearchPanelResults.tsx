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
import moment from 'moment';
import { isEventNode } from '../../helpers/event';
import { SearchResult } from '../../stores/SearchStore';
import SearchResultGroup from './SearchResultGroup';
import { ActionType } from '../../models/EventAction';
import { BookmarkedItem } from '../../models/Bookmarks';
import { createStyleSelector } from '../../helpers/styleCreators';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: BookmarkedItem) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	next: () => void;
	prev: () => void;
	currentIndex: number;
	searchHistoryLength: number;
	resultGroups: [string, SearchResult[]][];
	timestamp: number;
	disabledRemove: boolean;
	showLoadMoreButton: boolean;
	loadMore: () => void;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		resultGroups,
		timestamp,
		onResultItemClick,
		onResultGroupClick,
		onResultDelete,
		disablePrev,
		disableNext,
		disabledRemove,
		next,
		prev,
		currentIndex,
		searchHistoryLength,
		showLoadMoreButton,
		loadMore,
	} = props;

	function computeKey(index: number) {
		const [, results] = resultGroups[index];
		const item = results[0];
		return isEventNode(item) ? item.eventId : item.messageId;
	}

	const arrowPrevClass = createStyleSelector('search-results__arrow', disablePrev ? 'disable' : '');

	const arrowNextClass = createStyleSelector(
		'search-results__arrow',
		disableNext ? 'disable' : '',
		'next',
	);

	return (
		<div className='search-results'>
			<div className='search-results__controls'>
				<button className={arrowPrevClass} disabled={disablePrev} onClick={prev} />
				{searchHistoryLength > 1 && (
					<div className='search-results__counter'>
						{currentIndex + 1} of {searchHistoryLength}
					</div>
				)}
				<button className={arrowNextClass} disabled={disableNext} onClick={next} />
			</div>
			<div className='history-point'>
				<p className='history-point__timestamp'>
					{moment(+timestamp)
						.utc()
						.format('DD.MM.YYYY HH:mm:ss.SSS')}
				</p>
				<button
					className='bookmark-item__remove-btn'
					disabled={disabledRemove}
					onClick={onResultDelete}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			</div>
			<div className='search-results__list'>
				{resultGroups.map(([_, results], index) => (
					<SearchResultGroup
						key={computeKey(index)}
						results={results}
						onResultClick={onResultItemClick}
						onGroupClick={onResultGroupClick}
					/>
				))}
				{showLoadMoreButton && (
					<button onClick={loadMore} className='actions-list__load-button'>
						Load more
					</button>
				)}
			</div>
		</div>
	);
};

export default SearchPanelResults;
