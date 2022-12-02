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
import Calendar from 'rc-calendar';
import moment, { Moment } from 'moment';
import 'rc-calendar/assets/index.css';
import { TimeInputType } from '../../../models/filter/FilterInputs';
import { useOutsideClickListener } from '../../../hooks';
import FilterTimepicker from './FilterTimePicker';

interface FilterDatetimePickerProps {
	value: number | null;
	setValue: (nextValue: number | null) => void;
	type: TimeInputType;
	onClose: () => void;
	left?: number;
	top?: number;
	className?: string;
}

const now = moment();
now.utcOffset(0);

const FilterDatetimePicker = ({
	value,
	setValue,
	type,
	onClose,
	left,
	top,
	className = '',
}: FilterDatetimePickerProps) => {
	const pickerRef = React.useRef<HTMLDivElement>(null);

	const [changedValue, setChangedValue] = React.useState(value);

	useOutsideClickListener(pickerRef, (e: MouseEvent) => {
		if (e.target instanceof Node && !pickerRef.current?.contains(e.target)) {
			onClose();
		}
	});

	React.useEffect(() => {
		setChangedValue(value);
	}, [value]);

	const change = (dateValue: Moment | null) => {
		if (!dateValue) return;
		if (dateValue.utc().startOf('day').isSameOrBefore(moment().startOf('day'))) {
			let appliedDate;
			if (changedValue) {
				appliedDate = moment(changedValue)
					.utc()
					.set('year', dateValue.year())
					.set('month', dateValue.month())
					.set('date', dateValue.date());
			} else {
				appliedDate = dateValue.utc().startOf('day');
			}
			setChangedValue(appliedDate.valueOf());
			return;
		}

		setChangedValue(moment().utc().startOf('day').valueOf());
	};

	const setTimeOffset = (minutes: number) => {
		setChangedValue(
			moment(changedValue || Date.now())
				.utc()
				.subtract(minutes, 'minutes')
				.valueOf(),
		);
	};

	const setNow = () => {
		setChangedValue(moment().utc().valueOf());
	};

	const getDisabledDate = (calendarDate?: Moment) => {
		if (!calendarDate) return false;

		const tomorrow = moment().utc().startOf('day').add(1, 'day');
		return calendarDate.valueOf() >= tomorrow.valueOf();
	};

	const onSubmit = () => {
		setValue(changedValue);
		onClose();
	};

	return (
		<div
			ref={pickerRef}
			className={`filter-datetime-picker ${className}`}
			style={{
				left: `${left || 0}px`,
				top: `${top || 0}px`,
			}}>
			<div className='filter-datetime-picker__header'>Select Date and Time</div>
			<div className='filter-datetime-picker__row'>
				{(type === TimeInputType.DATE_TIME || type === TimeInputType.DATE) && (
					<Calendar
						value={moment(changedValue).utcOffset(0)}
						defaultValue={now}
						onSelect={change}
						onChange={change}
						showDateInput={false}
						showToday={false}
						className='filter-datetime-picker__datepicker'
						disabledDate={getDisabledDate}
					/>
				)}
				{(type === TimeInputType.DATE_TIME || type === TimeInputType.TIME) && (
					<FilterTimepicker setValue={setChangedValue} value={changedValue} />
				)}
			</div>
			<div className='filter-datetime-picker__interval-controls'>
				<div className='filter-datetime-picker__interval-header'>Intervals</div>
				<div className='filter-datetime-picker__intervals'>
					<button className='filter-datetime-picker__interval' onClick={setNow}>
						Now
					</button>
					<button
						className='filter-datetime-picker__interval'
						onClick={setTimeOffset.bind(null, 15)}>
						15 Minutes
					</button>
					<button
						className='filter-datetime-picker__interval'
						onClick={setTimeOffset.bind(null, 60)}>
						1 Hour
					</button>
					<button
						className='filter-datetime-picker__interval'
						onClick={setTimeOffset.bind(null, 24 * 60)}>
						1 Day
					</button>
				</div>
			</div>
			<div className='filter-datetime-picker__controls'>
				<div className='filter-datetime-picker__controls button reset' onClick={onClose}>
					Reset
				</div>
				<div className='filter-datetime-picker__controls button submit' onClick={onSubmit}>
					Submit
				</div>
			</div>
		</div>
	);
};

export default FilterDatetimePicker;
