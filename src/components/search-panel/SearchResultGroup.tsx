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
import { observer } from 'mobx-react-lite';
import { isEventMessage, isEventNode, getItemId } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { useBookmarksStore, useSelectedStore } from '../../hooks';
import { SearchResult } from '../../stores/SearchStore';
import { getTimestampAsNumber } from '../../helpers/date';
import { BookmarkedItem } from '../../models/Bookmarks';
import { BookmarkItem } from '../bookmarks/BookmarksPanel';

interface SearchResultGroup {
	results: SearchResult[];
	onResultClick: (searchResult: BookmarkedItem) => void;
}

const SearchResultGroup = ({ results, onResultClick }: SearchResultGroup) => {
	const { savedItems } = useSelectedStore();
	const bookmarksStore = useBookmarksStore();
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

	const getBookmarkToggler = (searchResult: SearchResult) => () => {
		if (isEventMessage(searchResult)) {
			bookmarksStore.toggleMessagePin(searchResult);
		} else {
			bookmarksStore.toggleEventPin(searchResult);
		}
	};

	const getIsToggled = (searchResult: SearchResult): boolean =>
		Boolean(savedItems.find(savedItem => getItemId(savedItem) === getItemId(searchResult)));

	const averageTimestamp = (() => {
		const groupTimestamps = results.map(getTimestampAsNumber);

		let timestamp;
		if (groupTimestamps.length === 1) {
			timestamp = groupTimestamps[0];
		} else {
			timestamp = Math.floor(
				(groupTimestamps[0] + groupTimestamps[groupTimestamps.length - 1]) / 2,
			);
		}
		return timestamp;
	})();

	const groupTimestamp =
		`${moment(averageTimestamp).utc().format('DD.MM.YYYY')} ` +
		`${moment(getTimestampAsNumber(results[0])).utc().format('HH:mm:ss.SSS')}-` +
		`${moment(getTimestampAsNumber(results[results.length - 1]))
			.utc()
			.format('HH:mm:ss.SSS')}`;

	if (results.length === 1) {
		return (
			<div className='search-result-single-item'>
				<BookmarkItem
					key={computeKey(0)}
					bookmark={results[0]}
					onClick={onResultClick}
					toggleBookmark={getBookmarkToggler(results[0])}
					isBookmarked={getIsToggled(results[0])}
					isBookmarkButtonDisabled={bookmarksStore.isBookmarksFull}
				/>
			</div>
		);
	}

	return (
		<>
			<div className='search-result-group'>
				<button className={expandButtonClass} onClick={() => setIsExpanded(!isExpanded)} />
				<div className='search-result-group__header'>
					<span className='search-result-group__results-count'>{results.length}</span>
					<div className='search-result-group__most-popular-names'>
						{mostPopularNames.map((name, index) => (
							<span key={index} className='search-result-group__name' title={name}>
								{name}
							</span>
						))}
					</div>
					<span className='search-result-group__timestamp'>{groupTimestamp}</span>
				</div>
			</div>
			<div className='search-result-group-items'>
				{isExpanded &&
					results.map((result, index) => (
						<BookmarkItem
							key={computeKey(index)}
							bookmark={result}
							onClick={onResultClick}
							toggleBookmark={getBookmarkToggler(result)}
							isBookmarked={getIsToggled(result)}
							isBookmarkButtonDisabled={bookmarksStore.isBookmarksFull}
						/>
					))}
			</div>
		</>
	);
};

export default observer(SearchResultGroup);
