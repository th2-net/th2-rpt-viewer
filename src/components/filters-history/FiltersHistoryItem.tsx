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
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import { FilterState } from '../search-panel/SearchPanelFilters';
import { FiltersState } from './FiltersHistory';
import { EventsFiltersInfo, MessagesFilterInfo } from '../../api/sse';
import { getDefaultEventsFiltersState, getDefaultMessagesFiltersState } from '../../helpers/search';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { showNotification } from '../../helpers/showNotification';

interface Props {
	item: FiltersHistoryType<FilterState>;
	filter: FiltersState;
	eventsFilterInfo: EventsFiltersInfo[];
	messagesFilterInfo: MessagesFilterInfo[];
}

const FiltersHistoryItem = ({ item, filter, eventsFilterInfo, messagesFilterInfo }: Props) => {
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

	const defaultState =
		item.type === 'event'
			? getDefaultEventsFiltersState(eventsFilterInfo)
			: getDefaultMessagesFiltersState(messagesFilterInfo);

	return (
		<div
			className='filters-history__item'
			onClick={() => {
				filter.setState({ ...defaultState, ...item.filters });
			}}>
			<button
				className='share'
				title='Share filters'
				onClick={(e: React.MouseEvent) => {
					e.stopPropagation();
					const filters = new URLSearchParams({
						filters: window.btoa(JSON.stringify(item)),
					});
					copyTextToClipboard(
						[window.location.origin, window.location.pathname, `?${filters}`].join(''),
					);
					showNotification('Filter copied to clipboard');
				}}
			/>
			<div className='content'>
				{Object.entries(item.filters).map(([key, value], i) => {
					const filterName = key as keyof FilterState;
					const label = (key.charAt(0).toUpperCase() + key.slice(1)).split(/(?=[A-Z])/).join(' ');
					const update = getValuesUpdater(filterName);
					const state = getState(filterName);
					if (!value) {
						return null;
					}
					return (
						<div key={key} className='content__item'>
							<p className='content__label'>
								{item.filters[filterName]?.negative ? (
									<span className='content__excluded' title='Excluded' />
								) : null}
								{label}:
							</p>
							<div className='content__values'>
								{typeof value.values === 'string' ? (
									<button
										className='history-bubble'
										key={`${key}-${i}`}
										onClick={(e: React.MouseEvent) => {
											e.stopPropagation();
											update(value.values);
										}}>
										{value.values}
									</button>
								) : (
									value.values.map((val: string, j: number) => {
										return (
											<button
												className='history-bubble'
												key={`${key}-${i}-${j}`}
												onClick={(e: React.MouseEvent) => {
													e.stopPropagation();
													const values = state ? state.values : [];
													if (!values.includes(val)) {
														update([...values, val]);
													}
												}}>
												{val}
											</button>
										);
									})
								)}
							</div>
						</div>
					);
				})}
			</div>
			<hr />
		</div>
	);
};

export default FiltersHistoryItem;
