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
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import { ModalPortal } from '../Portal';
import '../../styles/filter.scss';
import FilterPanelRow from './FilterPanelRow';

export type FilterRowConfig = FilterRowDatetimeRangeConfig | FilterRowStringConfig;

export type FilterRowBaseConfig = {
	id: string;
	label: string;
};

export type FilterRowDatetimeRangeConfig = FilterRowBaseConfig & {
	type: 'datetime-range';
	value: [number, number];
	setValue: (nextValue: [number, number]) => void;
};

export type FilterRowStringConfig = FilterRowBaseConfig & {
	type: 'string';
	value: string;
	setValue: (nextValue: string) => void;
};

interface Props {
	isFilterApplied: boolean;
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
	config: FilterRowConfig[];
	isDisabled?: boolean;
	onSubmit?: () => void;
	onClearAll?: () => void;
}

const FilterPanel = ({
	isFilterApplied,
	showFilter,
	setShowFilter,
	config,
	isDisabled = false,
	onSubmit,
	onClearAll,
}: Props) => {
	const filterBaseRef = React.useRef<HTMLDivElement>(null);
	const filterButtonRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(filterBaseRef, (e: MouseEvent) => {
		if (!filterButtonRef.current?.contains(e.target as Element)) {
			setShowFilter(false);
		}
	});

	const filterWrapperClass = createStyleSelector(
		'filter-wrapper',
		showFilter ? 'active' : null,
	);

	const filterTitleClass = createBemElement(
		'filter',
		'title',
		showFilter ? 'active' : null,
		!showFilter && isFilterApplied ? 'applied' : null,
	);

	const filterIconClass = createBemElement(
		'filter',
		'icon',
		showFilter ? 'active' : null,
		!showFilter && isFilterApplied ? 'applied' : null,
	);

	const filterButtonClass = createBemElement(
		'filter',
		'button',
		isDisabled ? 'disabled' : null,
	);

	const handleSubmit = () => {
		if (onSubmit) {
			onSubmit();
			setShowFilter(false);
		}
	};

	return (
		<div className={filterWrapperClass}>
			<div
				className={filterButtonClass}
				ref={filterButtonRef}
				onClick={() => {
					if (!isDisabled) {
						setShowFilter(!showFilter);
					}
				}}>
				<div className={filterIconClass}/>
				<div className={filterTitleClass}>
					{
						isFilterApplied
							? 'Filter Applied'
							: showFilter
								? 'Hide Filter'
								: 'Show Filter'
					}
				</div>
			</div>
			<ModalPortal isOpen={showFilter}>
				<div
					ref={filterBaseRef}
					className="filter"
					style={{
						left: `${filterButtonRef.current?.getBoundingClientRect().left}px`,
						top: `${filterButtonRef.current?.getBoundingClientRect().bottom}px`,
					}}>
					{
						config.map(configItem => (
							<FilterPanelRow rowConfig={configItem} key={configItem.id}/>
						))
					}
					<div className="filter__controls filter-controls">
						<div className="filter-controls__clear-btn" onClick={onClearAll}>
							<div className="filter-controls__clear-icon"/>
							Clear All
						</div>
						<div className='filter-row__submit-btn' onClick={handleSubmit}>
							Submit
						</div>
					</div>
				</div>
			</ModalPortal>
		</div>
	);
};

export default FilterPanel;
