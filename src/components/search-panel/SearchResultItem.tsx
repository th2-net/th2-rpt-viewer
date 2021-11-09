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
import { formatTime, getTimestampAsNumber } from '../../helpers/date';
import { getItemName, isEventMessage, isEventNode } from '../../helpers/event';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { SearchResult } from '../../stores/SearchStore';
import { EventFilterState, MessageFilterState } from './SearchPanelFilters';

const keysToHighlight: {
	eventTreeNode: Array<keyof EventTreeNode>;
	message: Array<keyof EventMessage>;
} = {
	eventTreeNode: [],
	message: ['body'],
};

const keysToDisplay: {
	eventTreeNode: Array<keyof EventTreeNode>;
	message: Array<keyof EventMessage>;
} = {
	eventTreeNode: ['parentId', 'type', 'eventName'],
	message: ['messageId', 'messageType', 'direction', 'sessionId', 'body', 'bodyBase64'],
};

const DETAIL_VALUE_LENGTH_LIMIT = 38;

type SearchResultItemProps = {
	result: SearchResult;
	filters: EventFilterState | MessageFilterState;
	onClick: (item: SearchResult) => void;
};

const SearchResultItem = ({ result, filters, onClick }: SearchResultItemProps) => {
	const nameClassName = createBemElement(
		'search-result',
		'name',
		result.type,
		isEventNode(result) ? (result.successful ? 'success' : 'fail') : null,
	);

	const iconClassName = createStyleSelector(
		'search-result__icon',
		`${result.type}-icon`,
		isEventMessage(result) ? null : result.successful ? 'passed' : 'failed',
	);

	const resultDetails = (keysToDisplay[result.type] as string[]).reduce(
		(obj, key) => ({ ...obj, [key]: result[key as keyof typeof result] }),
		{},
	);

	const highlightMatching = (
		string: string,
		filterValues: string[],
		isRoot = false,
	): JSX.Element => {
		const filterValue = filterValues[0];
		const newValuesList = filterValues.slice(1);

		const leftAddictionLength = Math.ceil(
			Math.max(DETAIL_VALUE_LENGTH_LIMIT - filterValue.length, 0) / 2,
		);
		const rightAddictionLength = Math.floor(
			Math.max(DETAIL_VALUE_LENGTH_LIMIT - filterValue.length, 0) / 2,
		);

		const matchingIndex = string.indexOf(filterValue);

		if (matchingIndex === -1) {
			if (isRoot) throw new Error("Detail's value should contain filter's values");

			return newValuesList.length ? (
				highlightMatching(string, filterValues.slice(1))
			) : (
				<>{string}</>
			);
		}

		const leftAddiction = string.substring(matchingIndex - leftAddictionLength, matchingIndex);
		const rightAddiction = string.substring(
			matchingIndex + filterValue.length,
			matchingIndex + filterValue.length + rightAddictionLength,
		);

		return isRoot ? (
			<span className='search-result__body-value'>
				&nbsp;
				{leftAddiction && newValuesList.length
					? highlightMatching(leftAddiction, newValuesList)
					: leftAddiction}
				<span className='filtered'>{filterValue}</span>
				{rightAddiction && newValuesList.length
					? highlightMatching(rightAddiction, newValuesList)
					: rightAddiction}
			</span>
		) : (
			<>
				{leftAddiction && newValuesList.length
					? highlightMatching(leftAddiction, newValuesList)
					: leftAddiction}
				<span className='filtered'>{filterValue}</span>
				{rightAddiction && newValuesList.length
					? highlightMatching(rightAddiction, newValuesList)
					: rightAddiction}
			</>
		);
	};

	const renderResultDetail = (
		[k, value]: [string, unknown],
		index: number,
		array: [string, unknown][],
	) => {
		const key = k as keyof typeof result;

		const isFiltered =
			keysToHighlight[result.type].includes(key) &&
			filters[key].values.length > 0 &&
			!filters[key].negative;

		const detailValue = typeof value === 'object' ? JSON.stringify(value) : (value as string);
		let valueJSX: JSX.Element;

		if (isFiltered) {
			valueJSX = highlightMatching(detailValue, filters[key].values, true);
		} else {
			valueJSX = (
				<span className='search-result__body-value'>
					&nbsp;
					{detailValue.substr(0, DETAIL_VALUE_LENGTH_LIMIT)}
				</span>
			);
		}

		return (
			<React.Fragment key={key}>
				<span
					className={createBemElement(
						'search-result',
						'body-key',
						isFiltered ? 'filtered' : null,
					)}>{`"${key}":`}</span>
				{valueJSX}
				{array.length !== index + 1 ? ', ' : ''}
			</React.Fragment>
		);
	};

	return (
		<div className='search-result'>
			<i className={iconClassName} />
			<div className={nameClassName} onClick={() => onClick && onClick(result)}>
				{getItemName(result)}
			</div>
			<div className='search-result__timestamp'>{formatTime(getTimestampAsNumber(result))}</div>
			<div className='search-result__body'>
				{Object.entries(resultDetails).map(renderResultDetail)}
			</div>
		</div>
	);
};

export default SearchResultItem;
