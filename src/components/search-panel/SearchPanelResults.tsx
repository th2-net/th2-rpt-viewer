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
import { ActionType } from '../../models/EventAction';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: BookmarkedItem) => void;
	onResultGroupClick: (timestamp: number, resultType: ActionType) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	resultGroups: [string, SearchResult[]][];
	timestamp: number;
	disabledRemove: boolean;
	formCollapsed: boolean;
	setFormCollapsed: (collapsed: boolean) => void;
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
		showToggler,
		next,
		prev,
		formCollapsed,
		setFormCollapsed,
	} = props;

	function computeKey(index: number) {
		const [, results] = resultGroups[index];
		const item = results[0];

		return isEventNode(item) ? item.eventId : item.messageId;
	}

	const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
		if (e.target === e.currentTarget) {
			if ((e.target as HTMLDivElement).scrollTop === 0 && formCollapsed) {
				setFormCollapsed(false);
			} else if ((e.target as HTMLDivElement).scrollTop > 0 && !formCollapsed) {
				setFormCollapsed(true);
			}

			e.stopPropagation();
		}
	};

	return (
		<div className='search-results' onScroll={onScroll}>
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
				{resultGroups.map(([_, results], index) => (
					<SearchResultGroup
						key={computeKey(index)}
						results={results}
						onResultClick={onResultItemClick}
						onGroupClick={onResultGroupClick}
					/>
				))}
			</div>
		</div>
	);
};

export default SearchPanelResults;
