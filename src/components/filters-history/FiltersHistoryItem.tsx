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
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../search-panel/SearchPanelFilters';
import { FiltersState } from './FiltersHistory';

interface Props {
	item: FiltersHistoryType<FilterState>;
	filter: FiltersState;
}

const FiltersHistoryItem = ({ item, filter }: Props) => {
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

	return (
		<div
			className='filters-history__item'
			onClick={() => {
				const toReset = Object.fromEntries(
					Object.entries(filter.state)
						.filter(([key]) => !Object.keys(item.filters).includes(key))
						.map(([key, value]) => {
							let resetedValue: string | string[];
							switch (value.type) {
								case 'string':
									resetedValue = '';
									break;
								case 'string[]':
									resetedValue = [];
									break;
								case 'switcher':
									resetedValue = 'any';
									break;
								default:
									resetedValue = '';
									break;
							}
							return [key, { ...value, negative: false, values: resetedValue }];
						}),
				);

				filter.setState({ ...toReset, ...item.filters } as Partial<EventFilterState> &
					Partial<MessageFilterState>);
			}}>
			<p className='title'>{moment(item.timestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS')}</p>
			<div className='content'>
				{Object.entries(item.filters).map(([key, value], i) => {
					const label = (key.charAt(0).toUpperCase() + key.slice(1)).split(/(?=[A-Z])/).join(' ');
					const update = getValuesUpdater(key as keyof FilterState);
					const state = getState(key as keyof FilterState);
					if (!value) {
						return null;
					}
					return (
						<div key={key} className='content__item'>
							<p className='content__label'>{label}:</p>
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
