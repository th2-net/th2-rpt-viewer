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
import { FilterRowDatetimeRangeConfig } from './FilterPanel';
import { createBemElement } from '../../helpers/styleCreators';

interface FilterTimepickerProps {
	time: number | null;
	config: FilterRowDatetimeRangeConfig;
	name: string;
}

const HOURS = [...Array(24).keys()];
const MINUTES = [...Array(60).keys()];

const FilterTimepicker = ({
	time,
	config,
	name,
}: FilterTimepickerProps) => {
	const selectedHour = time ? moment(time).utc().hour() : null;
	const selectedMinute = time ? moment(time).utc().minute() : null;

	const isToday = moment(time).startOf('day').isSame(moment().startOf('day'));
	const today = moment().utc();

	const hourItems = HOURS
		.map(hour => ({
			isSelected: hour === selectedHour,
			isBlocked: isToday ? hour > today.hour() : false,
			value: hour,
		}));
	const minuteItems = MINUTES
		.map(minute => ({
			isSelected: minute === selectedMinute,
			isBlocked: (isToday && moment(time).utc().hour() === today.hour())
				? minute > today.minutes()
				: false,
			value: minute,
		}));

	const onDateSelect = (hour: number, isBlocked: boolean) => {
		if (isBlocked) return;

		let appliedDate: number;
		if (time) {
			appliedDate = moment(time)
				.utc()
				.hour(hour)
				.valueOf();
		} else {
			appliedDate = moment()
				.utc()
				.startOf('hour')
				.hour(hour)
				.valueOf();
		}
		if (name === 'from') {
			config.setFromValue(appliedDate);
		} else {
			config.setToValue(appliedDate);
		}
	};

	const onTimeSelect = (minute: number, isBlocked: boolean) => {
		if (isBlocked) return;

		let appliedDate: number;
		if (time) {
			appliedDate = moment(time)
				.utc()
				.minute(minute)
				.valueOf();
		} else {
			appliedDate = moment()
				.utc()
				.startOf('hour')
				.minute(minute)
				.valueOf();
		}
		if (name === 'from') {
			config.setFromValue(appliedDate);
		} else {
			config.setToValue(appliedDate);
		}
	};

	const getItemClass = (isSelected: boolean, isBlocked: boolean): string =>
		createBemElement(
			'filter-timepicker',
			'scroll-item',
			isSelected ? 'active' : null,
			isBlocked ? 'blocked' : null,
		);

	return (
		<div className='filter-timepicker'>
			<div className="filter-timepicker__scroll">
				{
					hourItems.map(hour => (
						<div
							key={hour.value}
							className={getItemClass(hour.isSelected, hour.isBlocked)}
							onClick={() => onDateSelect(hour.value, hour.isBlocked)}>
							{hour.value}
						</div>
					))
				}
			</div>
			<div className="filter-timepicker__scroll">
				{
					minuteItems.map(minute => (
						<div
							key={minute.value}
							className={getItemClass(minute.isSelected, minute.isBlocked)}
							onClick={() => onTimeSelect(minute.value, minute.isBlocked)}>
							{minute.value}
						</div>
					))
				}
			</div>
		</div>
	);
};

export default FilterTimepicker;
