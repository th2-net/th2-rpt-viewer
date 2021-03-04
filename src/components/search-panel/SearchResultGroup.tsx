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
import { isEventMessage, isEventNode } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { SearchResult } from '../../stores/SearchStore';
import { BookmarkedItem, BookmarkItem } from '../BookmarksPanel';

interface SearchResultGroup {
	results: SearchResult[];
	onResultClick: (searchResult: BookmarkedItem) => void;
}

const SearchResultGroup = ({ results, onResultClick }: SearchResultGroup) => {
	const [isExpanded, setIsExpanded] = React.useState(false);

	const expandButtonClass = createBemElement(
		'search-result-group',
		'expand-button',
		isExpanded ? 'expanded' : null,
	);

	function computeKey(index: number) {
		const item = results[index];

		return isEventNode(item) ? item.eventId : item.messageId;
	}

	const namesEncountersMap = new Map<string, number>();
	results
		.map(result => (isEventMessage(result) ? result.messageType : result.eventName))
		.forEach(name => {
			if (namesEncountersMap.has(name)) {
				let counter = namesEncountersMap.get(name);
				if (counter) namesEncountersMap.set(name, ++counter);
			} else {
				namesEncountersMap.set(name, 1);
			}
		});
	const mostPopularNames = Array.from(namesEncountersMap)
		.sort((a, b) => b[1] - a[1])
		.map(entry => entry[0])
		.splice(0, 3);

	return (
		<>
			<div className='search-result-group' onClick={() => setIsExpanded(!isExpanded)}>
				<button className={expandButtonClass} />
				<div
					className='search-result-group__header'
					style={{
						alignItems: mostPopularNames.length > 1 ? 'flex-start' : 'center',
					}}>
					<span className='search-result-group__results-count'>{results.length}</span>
					<div className='search-result-group__most-popular-names'>
						{mostPopularNames.map((name, index) => (
							<span key={index} className='search-result-group__name'>
								{name}
							</span>
						))}
					</div>
				</div>
			</div>
			{isExpanded &&
				results.map((result, index) => (
					<BookmarkItem key={computeKey(index)} item={result} onClick={onResultClick} />
				))}
		</>
	);
};

export default SearchResultGroup;
