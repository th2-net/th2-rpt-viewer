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
import { TimeInputType } from 'models/filter/FilterInputs';
import { useOutsideClickListener } from 'hooks';
import FilterTimepicker from './FilterTimePicker';

interface FilterDatetimePickerProps {
	value: number | null;
	setValue: (nextValue: number | null) => void;
	type: TimeInputType;
	onClose?: () => void;
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

	useOutsideClickListener(pickerRef, (e: MouseEvent) => {
		if (onClose && e.target instanceof Node && !pickerRef.current?.contains(e.target)) {
			onClose();
		}
	});

	const change = (dateValue: Moment | null) => {
		if (!dateValue) return;
		if (dateValue.utc().startOf('day').isSameOrBefore(moment().startOf('day'))) {
			let appliedDate;
			if (value) {
				appliedDate = moment(value)
					.utc()
					.set('year', dateValue.year())
					.set('month', dateValue.month())
					.set('date', dateValue.date());
			} else {
				appliedDate = dateValue.utc().startOf('day');
			}
			setValue(appliedDate.valueOf());
			return;
		}

		setValue(moment().utc().startOf('day').valueOf());
	};

	const setTimeOffset = (minutes: number) => {
		setValue(
			moment(value || Date.now())
				.utc()
				.subtract(minutes, 'minutes')
				.valueOf(),
		);
	};

	const setNow = () => {
		setValue(moment().utc().valueOf());
	};

	const getDisabledDate = (calendarDate?: Moment) => {
		if (!calendarDate) return false;

		const tomorrow = moment().utc().startOf('day').add(1, 'day');
		return calendarDate.valueOf() >= tomorrow.valueOf();
	};

	return (
		<div
			ref={pickerRef}
			className={`filter-datetime-picker ${className}`}
			style={{
				left: `${left || 0}px`,
				top: `${top || 0}px`,
			}}>
			<div className='filter-datetime-picker__row'>
				{(type === TimeInputType.DATE_TIME || type === TimeInputType.DATE) && (
					<Calendar
						value={moment(value).utcOffset(0)}
						defaultValue={now}
						onSelect={change}
						onChange={change}
						showDateInput={false}
						showToday={false}
						className='filter-datetime-picker__datepicker'
						disabledDate={getDisabledDate}
						renderFooter={() => (
							<div className='filter-datetime-picker__controls'>
								<button className='filter-datetime-picker__control' onClick={setNow}>
									now
								</button>
								<button
									className='filter-datetime-picker__control'
									onClick={setTimeOffset.bind(null, 15)}>
									-15m
								</button>
								<button
									className='filter-datetime-picker__control'
									onClick={setTimeOffset.bind(null, 60)}>
									-1h
								</button>
								<button
									className='filter-datetime-picker__control'
									onClick={setTimeOffset.bind(null, 24 * 60)}>
									-1d
								</button>
							</div>
						)}
					/>
				)}
				{(type === TimeInputType.DATE_TIME || type === TimeInputType.TIME) && (
					<FilterTimepicker setValue={setValue} value={value} />
				)}
			</div>
		</div>
	);
};

export default FilterDatetimePicker;
