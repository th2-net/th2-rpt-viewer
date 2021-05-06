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
import { FiltersHistory } from '../../stores/FiltersHistoryStore';
import { FilterState } from '../search-panel/SearchPanelFilters';
import { FiltersState } from './FiltersHistory';

interface Props {
	item: FiltersHistory;
	filter: FiltersState;
}

const FiltersHistoryItem = ({ item, filter }: Props) => {
	if (!filter) {
		return null;
	}
	function getValuesUpdater<T extends keyof FilterState>(name: T) {
		return function valuesUpdater<K extends FilterState[T]>(values: K) {
			if (filter) {
				filter.setState({ [name]: { ...filter.state[name], values } });
			}
		};
	}

	function getState<T extends keyof FilterState>(name: T) {
		return filter && filter.state[name];
	}

	return (
		<div className='filters-history__item'>
			<p className='title'>{moment(item.timestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS')}</p>
			<div className='content'>
				{Object.entries(item.filters).map(([key, value], i) => {
					const label = (key.charAt(0).toUpperCase() + key.slice(1)).split(/(?=[A-Z])/).join(' ');
					const update = getValuesUpdater(key as keyof FilterState);
					const state = getState(key as keyof FilterState);
					return (
						<div key={key} className='content__item'>
							<p className='content__label'>{label}:</p>
							<div className='content__values'>
								{typeof value === 'string' ? (
									<button
										key={`${key}-${i}`}
										onClick={() => {
											update(value as any);
										}}>
										{value}
									</button>
								) : (
									value.map((val, j) => {
										return (
											<button
												key={`${key}-${i}-${j}`}
												onClick={() => {
													const values = state ? state.values : [];
													if (!values.includes(val)) {
														update([...values, val] as any);
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
