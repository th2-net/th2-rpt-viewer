/** *****************************************************************************
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
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import { FilterState } from '../search-panel/SearchPanelFilters';
import { FiltersState } from './FiltersHistory';
import { EventsFiltersInfo, MessagesFilterInfo } from '../../api/sse';
import { getDefaultEventsFiltersState, getDefaultMessagesFiltersState } from '../../helpers/search';
import { prettifyCamelcase } from '../../helpers/stringUtils';

const FILTER_HISTORY_DATE_FORMAT = 'DD.MM.YYYY HH:mm:ss.SSS' as const;

interface Props {
	item: FiltersHistoryType<FilterState>;
	filter: FiltersState;
	eventsFilterInfo: EventsFiltersInfo[];
	messagesFilterInfo: MessagesFilterInfo[];
	closeHistory: () => void;
}

const FiltersHistoryItem = (props: Props) => {
	const { item, filter, eventsFilterInfo, messagesFilterInfo, closeHistory } = props;

	if (!filter) {
		return null;
	}

	function getValuesUpdater<T extends keyof FilterState>(name: T) {
		return function valuesUpdater(values: string | string[]) {
			if (filter) {
				filter.setState({ [name]: { ...filter.state[name], values } });
			}
		};
	}

	function getState<T extends keyof FilterState>(name: T) {
		return filter && filter.state[name];
	}

	function onFilterSelect() {
		if (filter) {
			const defaultState =
				item.type === 'event'
					? getDefaultEventsFiltersState(eventsFilterInfo)
					: getDefaultMessagesFiltersState(messagesFilterInfo);
			filter.setState({ ...defaultState, ...item.filters });
			closeHistory();
		}
	}

	function onFilterBubbleSelect(filterName: keyof FilterState, bubbleValue: string) {
		const state = getState(filterName);
		const stateValues = state?.values;
		const updaterFn = getValuesUpdater(filterName);

		if (typeof stateValues === 'string') {
			updaterFn(bubbleValue);
		}

		if (stateValues && Array.isArray(stateValues)) {
			if (!stateValues.includes(bubbleValue)) {
				updaterFn([...stateValues, bubbleValue]);
			}
		}
	}

	function onFilterPin() {
		// TODO: handle filter pin
	}

	return (
		<div className='filter-history-item' onClick={onFilterSelect}>
			<p className='filter-history-item__title'>
				{moment.utc(item.timestamp).format(FILTER_HISTORY_DATE_FORMAT)}
			</p>
			<>
				{Object.entries(item.filters).map(([key, value], i) => {
					const filterName = key as keyof FilterState;

					return (
						value && (
							<FilterHistoryItemRow
								onFilterPin={onFilterPin}
								onBubbleClick={onFilterBubbleSelect}
								filterName={filterName}
								value={value.values}
								isExcluded={Boolean(item.filters[filterName]?.negative)}
							/>
						)
					);
				})}
			</>
			<hr />
		</div>
	);
};

export default React.memo(FiltersHistoryItem);

interface FilterHistoryItemRowProps {
	filterName: keyof FilterState;
	isExcluded: boolean;
	value: string | string[];
	onBubbleClick: (filterName: keyof FilterState, value: string) => void;
	onFilterPin: () => void;
}

function FilterHistoryItemRow(props: FilterHistoryItemRowProps) {
	const { filterName, isExcluded, value, onBubbleClick, onFilterPin } = props;

	const label = prettifyCamelcase(filterName);

	function handleBubbleClick(e: React.MouseEvent, bubbleValue: string) {
		e.stopPropagation();
		onBubbleClick(filterName, bubbleValue);
	}

	function handleFilterPin(e: React.MouseEvent) {
		e.stopPropagation();
		onFilterPin();
	}

	const values = typeof value === 'string' ? [value] : value;

	return (
		<div key={filterName} className='filter-history-item__row'>
			<p className='filter-history-item__row-label'>
				{isExcluded && <span className='filter-history-item__excluded-icon' title='Excluded' />}
				{label}:
			</p>
			<button style={{ position: 'absolute', top: 0, right: 0 }} onClick={handleFilterPin}>
				Pin
			</button>
			<div className='filter-history-item__row-values'>
				{values.map(filterValue => {
					return (
						<button
							className='filter-history-item__row-bubble'
							key={`${filterName}-${filterValue}`}
							onClick={e => handleBubbleClick(e, filterValue)}>
							{filterValue}
						</button>
					);
				})}
			</div>
		</div>
	);
}
