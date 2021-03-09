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
import { createBemBlock } from '../../../helpers/styleCreators';
import {
	DateTimeInputType,
	FilterRowDatetimeRangeConfig,
} from '../../../models/filter/FilterInputs';
import DatetimeInput from '../date-time-inputs/DateTimeInput';

export default function DatetimeFilterRow({ config }: { config: FilterRowDatetimeRangeConfig }) {
	const wrapperClassName = createBemBlock('filter-row', config.className || null);

	const renderInput = (inputConfig: DateTimeInputType) => [
		inputConfig.label && (
			<label
				key={`${inputConfig.id}-label`}
				htmlFor={inputConfig.id}
				className={inputConfig.labelClassName}>
				{inputConfig.label}
			</label>
		),
		<DatetimeInput {...inputConfig} inputConfig={inputConfig} key={inputConfig.id} />,
	];

	return (
		<div className={wrapperClassName}>
			{config.inputs.map((inputConfig: DateTimeInputType) => renderInput(inputConfig))}
			<div className='filter-time-controls'>
				<div className='filter-row__arrow-icon' />
				{config.timeShortcuts.map(({ label, onClick }) => (
					<div key={label} className='filter-time-control' onClick={onClick}>
						{label}
					</div>
				))}
			</div>
		</div>
	);
}
