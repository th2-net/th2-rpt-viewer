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
import { Result } from './SearchPanel';
import { BookmarkItem } from '../BookmarksPanel';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: Result) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	results: Array<Result>;
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

	return (
		<div className='search-results'>
			{showToggler && (
				<div className='search-results__controls'>
					<button className='search-results__arrow' disabled={disablePrev} onClick={prev}></button>
					<button
						className='search-results__arrow next'
						disabled={disableNext}
						onClick={next}></button>
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
			<hr />
			{results.map((item: Result) => (
				<BookmarkItem
					key={`${timestamp}-${isEventNode(item) ? item.eventId : item.messageId}`}
					item={item}
					onClick={() => {
						onResultItemClick(item);
					}}
				/>
			))}
		</div>
	);
};

export default SearchPanelResults;
