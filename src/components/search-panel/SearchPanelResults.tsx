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
import { BookmarkedItem } from '../BookmarksPanel';
import { SearchResult } from '../../stores/SearchStore';
import SearchResultGroup from './SearchResultGroup';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: BookmarkedItem) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	resultGroups: Array<Array<SearchResult>>;
	timestamp: number;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		resultGroups,
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
		const item = resultGroups[index][0] || 'key';

		return isEventNode(item) ? item.eventId : item.messageId;
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
			<div className='search-results__list'>
				{resultGroups.map((group, index) => (
					<SearchResultGroup
						key={computeKey(index)}
						results={group}
						onResultClick={onResultItemClick}
					/>
				))}
			</div>
		</div>
	);
};

export default SearchPanelResults;
