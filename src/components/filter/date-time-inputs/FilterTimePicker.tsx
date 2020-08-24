/** *****************************************************************************
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
import moment from 'moment';
import { DateTimeInputType } from '../../../models/filter/FilterInputs';
import TimeUnitList from './TimeUnitList';

interface FilterTimepickerProps {
	inputConfig: DateTimeInputType;
}

const FilterTimepicker = ({
	inputConfig,
}: FilterTimepickerProps) => {
	const { value: time } = inputConfig;

	const selectedHour = time ? moment(time).utc().hour() : null;
	const selectedMinute = time ? moment(time).utc().minute() : null;
	const selectedSecond = time ? moment(time).utc().second() : null;

	const isToday = moment(time).startOf('day').isSame(moment().startOf('day'));
	const today = moment().utc();

	const setTime = (
		unit: 'hour' | 'minutes' | 'seconds',
		unitValue: number,
	) => {
		const timestamp = inputConfig.value || moment.utc().valueOf();
		const updatedDate = moment(timestamp).utc().set(unit, unitValue);
		inputConfig.setValue(updatedDate.valueOf());
	};

	const setHour = setTime.bind(null, 'hour');
	const setMinutes = setTime.bind(null, 'minutes');
	const setSeconds = setTime.bind(null, 'seconds');

	const getBlockedMinutes = React.useCallback((minute: number) => {
		const currentDay = moment().utc();
		const isCurrentHour = moment(inputConfig.value).utc().hour() === currentDay.hour();
		const isBlocked = (isToday && isCurrentHour) ? minute > currentDay.minutes() : false;

		return isBlocked;
	}, [inputConfig.value]);

	const getBlockedSeconds = React.useCallback((second: number) => {
		const currentDay = moment().utc();
		const isCurrentHour = moment(inputConfig.value).utc().hour() === currentDay.hour();
		const isCurrentMinute = moment(inputConfig.value).utc().minutes() === currentDay.minutes();

		return (isToday && isCurrentHour && isCurrentMinute) ? second > currentDay.seconds() : false;
	}, [inputConfig.value]);

	return (
		<div className='filter-timepicker'>
			<TimeUnitList
				unit="hour"
				selectedUnit={selectedHour}
				getIsBlocked={hour => isToday && hour > today.hour()}
				onUnitClick={setHour}
			/>
			<TimeUnitList
				unit="minutes"
				selectedUnit={selectedMinute}
				getIsBlocked={getBlockedMinutes}
				onUnitClick={setMinutes}
			/>
			<TimeUnitList
				unit="seconds"
				selectedUnit={selectedSecond}
				getIsBlocked={getBlockedSeconds}
				onUnitClick={setSeconds}
			/>
		</div>
	);
};

export default FilterTimepicker;
