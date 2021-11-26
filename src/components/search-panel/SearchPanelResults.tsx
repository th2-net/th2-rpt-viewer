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
import { getItemId } from '../../helpers/event';
import { BookmarkedItem } from '../bookmarks/BookmarksPanel';
import { SearchResult } from '../../stores/SearchStore';
import SearchResultGroup from './SearchResultGroup';
import { ActionType } from '../../models/EventAction';
import SearchPanelSeparator from './SearchPanelSeparator';

type Separator = [number, number];
type FlattenedResult = SearchResult | Separator;

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: BookmarkedItem) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	flattenedResult: FlattenedResult[];
	timestamp: number;
	disabledRemove: boolean;
	showLoadMoreButton: boolean;
	loadMore: () => void;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const {
		flattenedResult,
		timestamp,
		onResultItemClick,
		onResultDelete,
		disablePrev,
		disableNext,
		disabledRemove,
		showToggler,
		next,
		prev,
		showLoadMoreButton,
		loadMore,
	} = props;

	const listRef = React.useRef<HTMLDivElement>(null);

	function computeKey(index: number) {
		const result = flattenedResult[index];
		if (isSeparator(result)) return result[0].toString();
		return getItemId(result);
	}

	const isSeparator = (object: FlattenedResult): object is Separator => {
		return 'length' in object;
	};

	const renderResult = (index: number, result: FlattenedResult) => {
		if (isSeparator(result)) {
			return <SearchPanelSeparator prevElement={result[0]} nextElement={result[1]} />;
		}
		return <SearchResultGroup result={result} onResultClick={onResultItemClick} />;
	};

	const loadMoreButton = () => {
		return showLoadMoreButton ? null : (
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
			<div className='search-results__list' ref={listRef}>
				<Virtuoso
					data={flattenedResult}
					style={{ height: '100%' }}
					className={'search-results__list-items'}
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
