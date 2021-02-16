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
import { createStyleSelector } from '../../../helpers/styleCreators';
import { FilterRowTogglerConfig } from '../../../models/filter/FilterInputs';
import '../../../styles/toggler.scss';

const TogglerRow = ({ config }: { config: FilterRowTogglerConfig }) => {
	const { value, toggleValue, possibleValues, label, disabled, className = '' } = config;
	const togglerClassName = createStyleSelector('toggler', disabled ? 'disabled' : '');
	const togglerBarClassName = createStyleSelector('toggler__bar', className, value ? 'on' : 'off');
	const [firstLabel, secondLabel] = possibleValues;
	return (
		<div className='filter-row toggler-wrapper'>
			{label && <p className='filter-row__label'>{label}</p>}
			<div
				className={togglerClassName}
				onClick={() => {
					if (!disabled) {
						toggleValue();
					}
				}}>
				<p className='toggler__label'>{firstLabel}</p>
				<div className={togglerBarClassName}></div>
				<p className='toggler__label'>{secondLabel}</p>
			</div>
		</div>
	);
};

export default TogglerRow;
