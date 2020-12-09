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
import { FilterRowCheckboxConfig } from '../../../models/filter/FilterInputs';

const Checkbox = ({ config }: { config: FilterRowCheckboxConfig }) => {
	const { value, setValue, label, id } = config;
	return (
		<div className='filter-row'>
			<label className='filter-row__label' htmlFor={id}>
				{label}
			</label>
			<input type='checkbox' checked={value} onChange={setValue} />
		</div>
	);
};

export default Checkbox;
