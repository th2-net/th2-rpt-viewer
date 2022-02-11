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
import { getItemId, isEvent, isEventMessage } from '../../helpers/event';
import { createBemElement } from '../../helpers/styleCreators';
import { FilterEntry, SearchResult } from '../../stores/SearchStore';
import { getTimestampAsNumber } from '../../helpers/date';
import { ActionType } from '../../models/EventAction';
import SearchResultItem from './SearchResultItem';
import { EventFilterState, MessageFilterState } from './SearchPanelFilters';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../hooks';
import { EventMessage } from '../../models/EventMessage';

interface SearchResultGroup {
	results: SearchResult[];
	filters: EventFilterState | MessageFilterState;
	onResultClick: (
		searchResult: SearchResult,
		filter?: { type: 'body' | 'bodyBinary'; entry: FilterEntry },
	) => void;
	onGroupClick: (timestamp: number, resultType: ActionType) => void;
}

const SearchResultGroup = ({
	results,
	filters,
	onResultClick,
	onGroupClick,
}: SearchResultGroup) => {
	const [isExpanded, setIsExpanded] = React.useState(false);
	const messagesWorkspaceStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const expandButtonClass = createBemElement(
		'search-result-group',
		'expand-button',
		isExpanded ? 'expanded' : null,
	);

	function computeKey(index: number) {
		const item = results[index];

		return getItemId(item);
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

	// const getBookmarkToggler = (searchResult: SearchResult) => () => {
	// 	if (isEventMessage(searchResult)) {
	// 		selectedStore.toggleMessagePin(searchResult);
	// 	} else {
	// 		selectedStore.toggleEventPin(searchResult);
	// 	}
	// };

	// const getIsToggled = (searchResult: SearchResult): boolean => {
	// 	return Boolean(
	// 		selectedStore.savedItems.find(savedItem =>
	// getItemId(savedItem) === getItemId(searchResult)),
	// 	);
	// };

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

	const onSearchGroupClick = () => {
		onGroupClick(averageTimestamp, results[0].type);
	};

	const groupTimestamp =
		`${moment(averageTimestamp).utc().format('DD.MM.YYYY')} ` +
		`${moment(getTimestampAsNumber(results[0])).utc().format('HH:mm:ss.SSS')}-` +
		`${moment(getTimestampAsNumber(results[results.length - 1]))
			.utc()
			.format('HH:mm:ss.SSS')}`;

	const isMessageVisibleInMessagePanel = (message: EventMessage) => {
		const visibleMessages = messagesDataStore.messages.slice(
			messagesWorkspaceStore.currentMessagesIndexesRange.startIndex,
			messagesWorkspaceStore.currentMessagesIndexesRange.endIndex + 1,
		);

		return visibleMessages.some(({ messageId }) => messageId === message.messageId);
	};

	const isResultItemHighlighted = (result: SearchResult) => {
		if (isEvent(result)) {
			return true; // TODO: implement events highlighting
		}

		return isMessageVisibleInMessagePanel(result);
	};

	if (results.length === 1) {
		return (
			<div className='search-result-single-item'>
				<SearchResultItem
					result={results[0]}
					filters={filters}
					onResultClick={onResultClick}
					highlighted={isResultItemHighlighted(results[0])}
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
					<div className='search-result-group__most-popular-names' onClick={onSearchGroupClick}>
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
						<SearchResultItem
							key={computeKey(index)}
							result={result}
							filters={filters}
							onResultClick={onResultClick}
							highlighted={isResultItemHighlighted(result)}
						/>
					))}
			</div>
		</>
	);
};

export default observer(SearchResultGroup);
