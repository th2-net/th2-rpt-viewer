/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { observer } from 'mobx-react-lite';
import { useFirstEventWindowStore } from '../../hooks/useFirstEventWindowStore';
import FilterRow from './FilterRow';
import FilterType from '../../models/filter/FilterType';
import Checkbox from '../util/Checkbox';
import '../../styles/filter.scss';
import MessagesTimestampFilter from './MessagesTimestampFilter';

const FilterPanel = observer(() => {
	const eventWindowStore = useFirstEventWindowStore();
	const {
		blocks,
		isFilterApplied,
		isTransparent,
		isHighlighted,
		resetFilter,
	} = eventWindowStore.filterStore;

	return (
		<div className="filter">
			<MessagesTimestampFilter />
			{
				blocks.map((block, index) => (
					<div className="filter-row" key={index}>
						<div className="filter-row__divider">
							<div className="filter-row__divider-text">
								{index === 0 ? 'Filter' : 'and'}
							</div>
							<div className="filter-row__remove-btn"/>
						</div>
						<FilterRow
							block={block}
							rowIndex={index + 1}
						/>
					</div>
				))
			}
			<div className="filter-row">
				<div className="filter-row__divider">
					{blocks.length === 0 ? 'Filter' : 'and'}
				</div>
				<FilterRow
					block={{
						types: null,
						path: null,
						values: [],
					}}
					rowIndex={blocks.length + 1}/>
			</div>
			<div className="filter__controls filter-controls">
				<div className="filter-controls__counts">
					{
						isFilterApplied ? `${[
							blocks.some(({ types }: { types: string[] }) => types.includes(FilterType.ACTION))
								? `${0} Actions `
								: null,
							blocks.some(({ types }: { types: string[] }) => types.includes(FilterType.MESSAGE))
								? `${0} Messages `
								: null,
						].filter(Boolean).join(' and ')}Filtered` : null
					}
				</div>
				<Checkbox
					checked={isHighlighted}
					label='Highlight'
					onChange={() => eventWindowStore.filterStore.setIsHighlighted(!isHighlighted)}
					id='filter-highlight'/>
				<div className="filter-controls__transparency">
					Filtered out
					<input
						type="radio"
						id="filter-radio-hide"
						checked={!isTransparent}
						onChange={e => eventWindowStore.filterStore.setIsTransparent(false)}
					/>
					<label htmlFor="filter-radio-hide">Hide</label>
					<input
						type="radio"
						id="filter-radio-transparent"
						checked={isTransparent}
						onChange={e => eventWindowStore.filterStore.setIsTransparent(true)}
					/>
					<label htmlFor="filter-radio-transparent">Transparent</label>
				</div>
				<div className="filter-controls__clear-btn" onClick={() => resetFilter()}>
					<div className="filter-controls__clear-icon"/>
					Clear All
				</div>
			</div>
		</div>
	);
});

export default FilterPanel;
