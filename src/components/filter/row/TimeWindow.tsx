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
import {
	DateTimeInputType,
	FilterRowTimeWindowConfig,
	IntervalInputType,
	TimeInputType,
} from '../../../models/filter/FilterInputs';
import DateTimeInput from '../date-time-inputs/DateTimeInput';
import IntervalInput from '../date-time-inputs/IntervalInput';

const TimeWindow = ({ config }: { config: FilterRowTimeWindowConfig }) => {
	return (
		<div className='filter-row'>
			{config.inputs.map((inputConfig: DateTimeInputType | IntervalInputType) => [
				inputConfig.label && (
					<label
						key={`${inputConfig.id}-label`}
						htmlFor={inputConfig.id}
						className={inputConfig.labelClassName}>
						{inputConfig.label}
					</label>
				),
				inputConfig.type === TimeInputType.DATE_TIME ? (
					<DateTimeInput inputConfig={inputConfig as DateTimeInputType} key={inputConfig.id} />
				) : (
					<IntervalInput inputConfig={inputConfig as IntervalInputType} key={inputConfig.id} />
				),
			])}
		</div>
	);
};

export default TimeWindow;
