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
import { createBemElement, createStyleSelector } from '../../../helpers/styleCreators';
import { FilterRowSwitcherConfig } from '../../../models/filter/FilterInputs';
import { changeStatusName } from '../../../helpers/stringUtils';

const SwitcherRow = ({ config }: { config: FilterRowSwitcherConfig }) => {
	const { value, setValue, possibleValues, disabled, defaultValue } = config;

	const setType = (type: string) => {
		if (!disabled) {
			setValue(changeStatusName(type));
		}
	};

	const rootClassName = config.labelClassName ? 'filter__compound-header' : 'search-type-switcher';

	const labelClassName = createStyleSelector(
		'filter-row__label',
		config.label === 'Status' ? 'status' : null,
	);

	return (
		<div className={rootClassName}>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			<div className={'search-type-switcher__togglers'}>
				{possibleValues.map(val => {
					const buttonClassName = createBemElement(
						'search-type-switcher',
						'button',
						'switch-search-type-button',
						val,
						changeStatusName(value) === val || (value === '' && defaultValue === val)
							? 'active'
							: null,
						disabled ? 'disabled' : null,
					);

					const iconClassName = createBemElement(
						'switch-search-type-button',
						'icon',
						val,
						changeStatusName(value) === val || (value === '' && defaultValue === val)
							? 'active'
							: null,
					);

					return (
						<button key={val} className={buttonClassName} onClick={() => setType(val)}>
							<i className={iconClassName} />
							<div className='switch-search-type-button__label'>{val}</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default SwitcherRow;
