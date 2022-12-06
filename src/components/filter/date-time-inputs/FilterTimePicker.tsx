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
import moment from 'moment';
import TimeUnitList from './TimeUnitList';

interface FilterTimepickerProps {
	value: number | null;
	setValue: (nextValue: number | null) => void;
}

const FilterTimepicker = (props: FilterTimepickerProps) => {
	const { value: time, setValue } = props;

	const currentTime = moment(time).utc();

	const selectedHour = time ? currentTime.hour() : null;
	const selectedMinute = time ? currentTime.minute() : null;

	const today = moment().utc();
	const isToday = currentTime.isSame(today, 'day');

	const setTime = (unit: 'hour' | 'minutes' | 'seconds', unitValue: number) => {
		const timestamp = time || moment.utc().valueOf();
		const updatedDate = moment(timestamp).utc().set(unit, unitValue);
		setValue(updatedDate.valueOf());
	};

	const setHour = setTime.bind(null, 'hour');
	const setMinutes = setTime.bind(null, 'minutes');

	const getBlockedMinutes = React.useCallback(
		(minute: number) => {
			const currentDay = moment().utc();
			const isCurrentHour = moment(time).utc().hour() === currentDay.hour();
			const isBlocked = isToday && isCurrentHour ? minute > currentDay.minutes() : false;

			return isBlocked;
		},
		[time],
	);

	const getBlockedHours = React.useCallback(
		(hour: number) => isToday && hour > today.hour(),
		[time],
	);

	return (
		<div className='filter-timepicker'>
			<TimeUnitList
				unit='hour'
				selectedUnit={selectedHour}
				getIsBlocked={getBlockedHours}
				onUnitChange={setHour}
			/>
			<div className='filter-timepicker__delimiter'>
				<span style={{ height: '70px' }}>:</span>
			</div>
			<TimeUnitList
				unit='minutes'
				selectedUnit={selectedMinute}
				getIsBlocked={getBlockedMinutes}
				onUnitChange={setMinutes}
			/>
		</div>
	);
};

export default React.memo(FilterTimepicker);
