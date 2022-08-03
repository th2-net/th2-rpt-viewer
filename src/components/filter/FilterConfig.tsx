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
import { createStyleSelector } from '../../helpers/styleCreators';
import FilterRow from './row';
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import '../../styles/filter.scss';

interface Props {
	isFilterApplied: boolean;
	config: FilterRowConfig[];
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
	onSubmit: () => void;
	onClearAll: () => void;
	renderFooter?: () => React.ReactNode;
}

const FilterConfig = (props: Props) => {
	const {
		isFilterApplied,
		showFilter,
		setShowFilter,
		config,
		onSubmit,
		onClearAll,
		renderFooter,
	} = props;

	function onSubmitClick() {
		onSubmit();
		setShowFilter(false);
	}

	function onClearAllClick() {
		onClearAll();
	}

	const filterWrapperClass = createStyleSelector(
		'filter-wrapper',
		showFilter ? 'active' : null,
		isFilterApplied ? 'applied' : null,
	);

	return (
		<div className={filterWrapperClass}>
			<div className='filter'>
				{config.map(rowConfig =>
					Array.isArray(rowConfig) ? (
						<div className='filter__compound' key={rowConfig.map(c => c.id).join('-')}>
							{rowConfig.map(_rowConfig => (
								<FilterRow rowConfig={_rowConfig} key={_rowConfig.id} />
							))}
						</div>
					) : (
						<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
					),
				)}
				<div className='filter__controls filter-controls'>
					{renderFooter && renderFooter()}
					<div className='filter-controls__clear-btn' onClick={onClearAllClick}>
						<div className='filter-controls__clear-icon' />
						Clear All
					</div>
					<div className='filter-row__button' onClick={onSubmitClick}>
						Submit filter
					</div>
				</div>
			</div>
		</div>
	);
};

export default React.memo(FilterConfig);
