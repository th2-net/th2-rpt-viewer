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
import { Virtuoso } from 'react-virtuoso';
import { isEventNode } from '../../helpers/event';
import { SearchResult } from '../../stores/SearchStore';
import SearchResultGroup from './SearchResultGroup';
import { ActionType } from '../../models/EventAction';
import SearchPanelSeparator from './SearchPanelSeparator';
import { EventFilterState, MessageFilterState } from './SearchPanelFilters';

type Separator = [number, number];
type FlattenedResult = SearchResult[] | Separator;

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: SearchResult) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultFilterClick: (range: [number, number]) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	flattenedResult: FlattenedResult[];
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
		onResultGroupClick,
		onResultFilterClick,
		onResultDelete,
		disablePrev,
		disableNext,
		disabledRemove,
		showToggler,
		next,
		prev,
		loadMore,
	} = props;

	function computeKey(index: number) {
		const results = flattenedResult[index];
		if (isSeparator(results)) return results[0];
		const item = results[0];
		return isEventNode(item) ? item.eventId : item.messageId;
	}

	const isSeparator = (object: FlattenedResult): object is Separator => {
		return !Number.isNaN(+object[0]);
	};

	const renderResult = (index: number, results: FlattenedResult) => {
		if (isSeparator(results)) {
			return (
				<React.Fragment>
					<SearchPanelSeparator prevElement={results[0]} nextElement={results[1]} />
				</React.Fragment>
			);
		}
		return (
			<React.Fragment>
				<SearchResultGroup
					results={results}
					filters={filters}
					onResultClick={onResultItemClick}
					onGroupClick={onResultGroupClick}
					onFilterClick={onResultFilterClick}
				/>
			</React.Fragment>
		);
	};

	const loadMoreButton = () => {
		return !loadMoreButton ? null : (
			<button onClick={loadMore} className='actions-list__load-button'>
				Load more
			</button>
		);
	};

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
