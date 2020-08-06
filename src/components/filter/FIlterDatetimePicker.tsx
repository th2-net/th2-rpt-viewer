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
import Calendar from 'rc-calendar';
import moment, { Moment } from 'moment';
// eslint-disable-next-line import/no-unassigned-import
import 'rc-calendar/assets/index.css';
import { FilterRowDatetimeRangeConfig } from './FilterPanel';
import useOutsideClickListener from '../../hooks/useOutsideClickListener';
import FilterTimepicker from './FilterTimePicker';

interface FilterDatetimePickerProps {
	value: number | null;
	config: FilterRowDatetimeRangeConfig;
	name: string;
	onClose: () => void;
	left?: number;
	top?: number;
}

const FilterDatetimePicker = ({
	value,
	config,
	name,
	onClose,
	left,
	top,
}: FilterDatetimePickerProps) => {
	const pickerRef = React.useRef<HTMLDivElement>(null);

	const change = (dateValue: Moment | null) => {
		if (!dateValue) return;
		if (dateValue.utc().startOf('day').isSameOrBefore(moment().startOf('day'))) {
			let appliedDate;
			if (value) {
				appliedDate = moment(value)
					.year(dateValue.year())
					.month(dateValue.month())
					.date(dateValue.date());
			} else {
				appliedDate = dateValue.utc().startOf('day');
			}
			if (name === 'from') {
				config.setFromValue(appliedDate.valueOf());
			} else {
				config.setToValue(appliedDate.valueOf());
			}
		} else if (name === 'from') {
			config.setFromValue(moment().utc().startOf('day').valueOf());
		} else {
			config.setToValue(moment().utc().startOf('day').valueOf());
		}
	};

	const setTimeOffset = (minutes: number) => {
		if (name === 'from') {
			config.setFromValue((value ?? Date.now()) - (minutes * 60 * 1000));
		} else {
			config.setToValue((value ?? Date.now()) - (minutes * 60 * 1000));
		}
	};

	const getDisabledDate = (calendarDate?: Moment) => {
		if (!calendarDate) return false;

		const tomorrow = moment().startOf('day').add(1, 'day');
		return calendarDate.valueOf() > tomorrow.valueOf();
	};

	useOutsideClickListener(pickerRef, (e: MouseEvent) => {
		if (!pickerRef.current?.contains(e.target as Element)) {
			onClose();
		}
	});

	return (
		<div
			ref={pickerRef}
			className='filter-datetime-picker'
			style={{
				left: `${left || 0}px`,
				top: `${top || 0}px`,
			}}>
			<div className="filter-datetime-picker__row">
				<Calendar
					value={moment(value)}
					onChange={change}
					showDateInput={false}
					className='filter-datetime-picker__datepicker'
					disabledDate={getDisabledDate}
					showToday={false}
				></Calendar>
				<FilterTimepicker
					time={value}
					config={config}
					name={name}
				/>
			</div>
			<div className="filter-datetime-picker__controls">
				<button
					className="filter-datetime-picker__control"
					onClick={setTimeOffset.bind(null, 0)}>now</button>
				<button
					className="filter-datetime-picker__control"
					onClick={setTimeOffset.bind(null, 15)}>-15m</button>
				<button
					className="filter-datetime-picker__control"
					onClick={setTimeOffset.bind(null, 60)}>-1h</button>
				<button
					className="filter-datetime-picker__control"
					onClick={setTimeOffset.bind(null, (24 * 60))}>-1d</button>
			</div>
		</div>
	);
};

export default FilterDatetimePicker;
