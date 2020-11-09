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
// eslint-disable-next-line import/no-unassigned-import
import 'rc-calendar/assets/index.css';
import { DateTimeInputType, TimeInputType } from '../../../models/filter/FilterInputs';
import useOutsideClickListener from '../../../hooks/useOutsideClickListener';
import FilterTimepicker from './FilterTimePicker';

interface FilterDatetimePickerProps {
	inputConfig: DateTimeInputType;
	onClose: () => void;
	left?: number;
	top?: number;
}

const now = moment();
now.utcOffset(0);

const FilterDatetimePicker = ({ inputConfig, onClose, left, top }: FilterDatetimePickerProps) => {
	const pickerRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(pickerRef, (e: MouseEvent) => {
		if (!pickerRef.current?.contains(e.target as Element)) {
			onClose();
		}
	});

	const change = (dateValue: Moment | null) => {
		if (!dateValue) return;
		if (dateValue.utc().startOf('day').isSameOrBefore(moment().startOf('day'))) {
			let appliedDate;
			if (inputConfig.value) {
				appliedDate = moment(inputConfig.value)
					.utc()
					.set('year', dateValue.year())
					.set('month', dateValue.month())
					.set('date', dateValue.date());
			} else {
				appliedDate = dateValue.utc().startOf('day');
			}
			inputConfig.setValue(appliedDate.valueOf());
			return;
		}

		inputConfig.setValue(moment().utc().startOf('day').valueOf());
	};

	const setTimeOffset = (minutes: number) => {
		inputConfig.setValue((inputConfig.value ?? Date.now()) - minutes * 60 * 1000);
	};

	const setNow = () => {
		inputConfig.setValue(moment().utc().valueOf());
	};

	const getDisabledDate = (calendarDate?: Moment) => {
		if (!calendarDate) return false;

		const tomorrow = moment().utc().startOf('day').add(1, 'day');
		return calendarDate.valueOf() > tomorrow.valueOf();
	};

	return (
		<div
			ref={pickerRef}
			className='filter-datetime-picker'
			style={{
				left: `${left || 0}px`,
				top: `${top || 0}px`,
			}}>
			<div className='filter-datetime-picker__row'>
				{(inputConfig.type === TimeInputType.DATE_TIME ||
					inputConfig.type === TimeInputType.DATE) && (
					<Calendar
						value={moment(inputConfig.value).utcOffset(0)}
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
				{(inputConfig.type === TimeInputType.DATE_TIME ||
					inputConfig.type === TimeInputType.TIME) && (
					<FilterTimepicker inputConfig={inputConfig} />
				)}
			</div>
		</div>
	);
};

export default FilterDatetimePicker;
