/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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
import { createBemElement } from '../../../helpers/styleCreators';
import { FilterRowSwitcherConfig } from '../../../models/filter/FilterInputs';

const SwitcherRow = ({ config }: { config: FilterRowSwitcherConfig }) => {
	const { value, setValue, possibleValues, disabled, defaultValue } = config;

	const setType = (type: string) => {
		if (!disabled) {
			setValue(type);
		}
	};

	const rootClassName = config.labelClassName ? 'filter__compound-header' : 'search-type-switcher';

	return (
		<div className={rootClassName}>
			{possibleValues.map(val => {
				const buttonClassName = createBemElement(
					'search-type-switcher',
					'switch-search-type-button',
					'switch-search-type-button',
					val,
					value === val || (value === '' && defaultValue === val) ? 'active' : null,
					disabled ? 'disabled' : null,
				);

				const iconClassName = createBemElement(
					'switch-search-type-button',
					'icon',
					val,
					value === val || (value === '' && defaultValue === val) ? 'active' : null,
				);

				return (
					<button key={val} className={buttonClassName} onClick={() => setType(val)}>
						<i className={iconClassName} />
						<div className='switch-search-type-button__label'>{val}</div>
					</button>
				);
			})}
		</div>
	);
};

export default SwitcherRow;
