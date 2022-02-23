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
import MaskedInput from 'react-text-mask';
import '../../../styles/filter-datetime.scss';
import 'rc-calendar/assets/index.css';
import { TimeInputType, DateTimeMask } from '../../../models/filter/FilterInputs';
import { useOutsideClickListener } from '../../../hooks';
import { createStyleSelector } from '../../../helpers/styleCreators';
import { formatTimestampValue } from '../../../helpers/date';
import { replaceUnfilledDateStringWithMinValues } from '../../../helpers/stringUtils';
import { SearchPanelFormState } from '../../../stores/SearchStore';
import { SearchDirection } from '../../../models/search/SearchDirection';

interface SearchFilterDatetimePickerProps {
	value: number | null;
	setValue: (nextValue: number | null) => void;
	updateForm: (stateUpdate: Partial<SearchPanelFormState>) => void;
	type: TimeInputType;
	inputValue: any;
	inputClassName: string;
	id: string;
	disabled: boolean | undefined;
	dateMask: DateTimeMask;
	timeMask: DateTimeMask;
	dateTimeMask: DateTimeMask;
	dateTimeInputMask: (string | RegExp)[];
	timeInputMask?: (string | RegExp)[];
	timestampsInputMask?: (string | RegExp)[];
	dateTimePipe: (maskedValue: string) => string | false;
	inputChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder: string;
	onClose?: () => void;
	isSearching: boolean;
	startSearch: () => void;
	pauseSearch: () => void;
	left?: number;
	top?: number;
	className?: string;
	previousTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	nextTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
}

const now = moment();
now.utcOffset(0);

const SearchFilterDatetimePicker = ({
	value,
	setValue,
	updateForm,
	previousTimeLimit,
	nextTimeLimit,
	type,
	inputValue,
	inputClassName,
	id,
	disabled,
	dateTimeMask,
	dateMask,
	timeMask,
	dateTimeInputMask,
	timeInputMask,
	timestampsInputMask,
	dateTimePipe,
	inputChangeHandler,
	placeholder,
	onClose,
	isSearching,
	startSearch,
	pauseSearch,
	left,
	top,
	className = '',
}: SearchFilterDatetimePickerProps) => {
	const pickerRef = React.useRef<HTMLDivElement>(null);

	const [inputPreviousValue, setInputPreviousValue] = React.useState(
		formatTimestampValue(previousTimeLimit.value, timeMask),
	);
	const [inputNextValue, setInputNextValue] = React.useState(
		formatTimestampValue(previousTimeLimit.value, timeMask),
	);
	const [inputTimeLimitsValue, setInputTimeLimitsValue] = React.useState(
		`${formatTimestampValue(previousTimeLimit.value, dateTimeMask)} \u2013 ${formatTimestampValue(
			nextTimeLimit.value,
			dateTimeMask,
		)}`,
	);

	const [focusedInput, setFocusedInput] = React.useState('startTimestamp');

	React.useEffect(() => {
		setInputPreviousValue(formatTimestampValue(previousTimeLimit.value, timeMask));
		setInputNextValue(formatTimestampValue(nextTimeLimit.value, timeMask));
		setInputTimeLimitsValue(
			`${formatTimestampValue(previousTimeLimit.value, dateTimeMask)} \u2013 ${formatTimestampValue(
				nextTimeLimit.value,
				dateTimeMask,
			)}`,
		);
	}, [previousTimeLimit.value, nextTimeLimit.value]);

	useOutsideClickListener(pickerRef, (e: MouseEvent) => {
		if (onClose && e.target instanceof Node && !pickerRef.current?.contains(e.target)) {
			onClose();
		}
	});

	const inputPreviousChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value: updatedValue } = e.target;
		setInputPreviousValue(updatedValue);

		if (updatedValue) {
			if (!updatedValue.includes('_')) {
				if (previousTimeLimit.value === null) {
					previousTimeLimit.setValue(
						moment
							.utc(
								`${formatTimestampValue(moment().utc().valueOf(), dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
					setValue(
						moment
							.utc(
								`${formatTimestampValue(moment().utc().valueOf(), dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
					updateForm({ searchDirection: SearchDirection.Next });
				} else {
					previousTimeLimit.setValue(
						moment
							.utc(
								`${formatTimestampValue(previousTimeLimit.value, dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
					setValue(
						moment
							.utc(
								`${formatTimestampValue(previousTimeLimit.value, dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
					updateForm({ searchDirection: SearchDirection.Next });
				}
			}

			return;
		}
		previousTimeLimit.setValue(null);
		setValue(moment().utc().valueOf());
	};

	const inputNextChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value: updatedValue } = e.target;
		setInputNextValue(updatedValue);

		if (updatedValue) {
			if (!updatedValue.includes('_')) {
				if (nextTimeLimit.value === null) {
					nextTimeLimit.setValue(
						moment
							.utc(
								`${formatTimestampValue(moment().utc().valueOf(), dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
				} else {
					nextTimeLimit.setValue(
						moment
							.utc(
								`${formatTimestampValue(nextTimeLimit.value, dateMask)} ${updatedValue}`,
								dateTimeMask,
							)
							.valueOf(),
					);
				}
			}
			return;
		}
		nextTimeLimit.setValue(null);
	};

	const isValidTime = (maskedValue: string): boolean => {
		return moment(
			replaceUnfilledDateStringWithMinValues(maskedValue, timeMask),
			timeMask,
		).isValid();
	};

	const timePipe = (maskedValue: string): string | false => {
		if (isValidTime(maskedValue)) {
			return maskedValue;
		}
		return false;
	};

	const change = (dateValue: Moment | null) => {
		const input =
			focusedInput === 'previousTimeLimit'
				? previousTimeLimit.value
				: focusedInput === 'nextTimeLimit'
				? nextTimeLimit.value
				: value;
		if (!dateValue) return;
		if (dateValue.utc().startOf('day').isSameOrBefore(moment().startOf('day'))) {
			let appliedDate;
			if (input) {
				appliedDate = moment(input)
					.utc()
					.set('year', dateValue.year())
					.set('month', dateValue.month())
					.set('date', dateValue.date());
			} else {
				appliedDate = dateValue.utc().startOf('day');
			}
			if (focusedInput === 'previousTimeLimit') {
				previousTimeLimit.setValue(appliedDate.valueOf());
				setValue(appliedDate.valueOf());
			} else if (focusedInput === 'nextTimeLimit') {
				nextTimeLimit.setValue(appliedDate.valueOf());
			} else setValue(appliedDate.valueOf());
			return;
		}

		if (focusedInput === 'previousTimeLimit')
			previousTimeLimit.setValue(moment().utc().startOf('day').valueOf());
		else if (focusedInput === 'nextTimeLimit')
			nextTimeLimit.setValue(moment().utc().startOf('day').valueOf());
		else setValue(moment().utc().startOf('day').valueOf());
	};

	const setTimeOffset = (minutes: number) => {
		setValue(
			moment(value || Date.now())
				.utc()
				.valueOf(),
		);
		updateForm({
			timeLimits: {
				previous: moment(value || Date.now())
					.utc()
					.subtract(minutes, 'minutes')
					.valueOf(),
				next: value,
			},
			searchDirection: SearchDirection.Previous,
		});
	};

	const setNow = () => {
		setValue(moment().utc().valueOf());
		updateForm({
			timeLimits: { previous: null, next: null },
			searchDirection: SearchDirection.Both,
		});
	};

	const getDisabledDate = (calendarDate?: Moment) => {
		if (!calendarDate) return false;

		const tomorrow = moment().utc().startOf('day').add(1, 'day');
		return calendarDate.valueOf() >= tomorrow.valueOf();
	};

	const handleCancelButton = () => {
		if (onClose) onClose();
		setNow();
	};

	const handleSearchButton = () => {
		if (isSearching) pauseSearch();
		else startSearch();
		if (onClose) onClose();
	};

	const maskedInputClassName = createStyleSelector(inputClassName, value ? 'non-empty' : null);
	return (
		<div
			ref={pickerRef}
			className={`filter-datetime-picker ${className}`}
			style={{
				left: `${left || 0}px`,
				top: `${top || 0}px`,
			}}>
			<div className='search-filter-datetime-picker__row'>
				<div className='search-filter-datetime-picker__header'>
					{previousTimeLimit.value || nextTimeLimit.value ? (
						<MaskedInput
							className={`filter-row__input ${maskedInputClassName} datetime-picker timestamps`}
							disabled={true}
							id={id}
							mask={timestampsInputMask}
							placeholder={placeholder}
							keepCharPositions={true}
							autoComplete='off'
							value={inputTimeLimitsValue}
						/>
					) : (
						<MaskedInput
							className={`filter-row__input ${maskedInputClassName} datetime-picker datetime`}
							disabled={disabled}
							id={id}
							mask={dateTimeInputMask}
							pipe={dateTimePipe}
							onChange={inputChangeHandler}
							onFocus={() => setFocusedInput('startTimestamp')}
							placeholder={placeholder}
							keepCharPositions={true}
							autoComplete='off'
							value={inputValue}
						/>
					)}
				</div>
				<div className='search-filter-datetime-picker__content'>
					<div className='search-filter-datetime-picker__content-left'>
						<div className='search-filter-datetime-picker__content-left-inputs-wrapper'>
							<div className='search-filter-datetime-picker__content-left-current-input-wrapper'>
								<div className='search-filter-datetime-picker__input-header'>
									{formatTimestampValue(previousTimeLimit.value, dateMask)}
								</div>
								<MaskedInput
									className={`filter-row__input ${maskedInputClassName} datetime-picker time`}
									disabled={disabled}
									mask={timeInputMask}
									pipe={timePipe}
									onChange={inputPreviousChangeHandler}
									onFocus={() => setFocusedInput('previousTimeLimit')}
									placeholder={placeholder}
									keepCharPositions={true}
									autoComplete='off'
									value={inputPreviousValue}
								/>
							</div>
							<div className='search-filter-datetime-picker__content-left-current-input-wrapper'>
								<div className='search-filter-datetime-picker__input-header'>
									{formatTimestampValue(nextTimeLimit.value, dateMask)}
								</div>
								<MaskedInput
									className={`filter-row__input ${maskedInputClassName} datetime-picker time`}
									disabled={disabled}
									mask={timeInputMask}
									pipe={timePipe}
									onChange={inputNextChangeHandler}
									onFocus={() => setFocusedInput('nextTimeLimit')}
									placeholder={placeholder}
									keepCharPositions={true}
									autoComplete='off'
									value={inputNextValue}
								/>
							</div>
						</div>
						<div className='search-filter-datetime-picker__controls'>
							<button className='search-filter-datetime-picker__controls-item-now' onClick={setNow}>
								Now
							</button>
							<button
								className='search-filter-datetime-picker__controls-item'
								onClick={setTimeOffset.bind(null, 15)}>
								Last 15 min
							</button>
							<button
								className='search-filter-datetime-picker__controls-item'
								onClick={setTimeOffset.bind(null, 60)}>
								Last Hour
							</button>
							<button
								className='search-filter-datetime-picker__controls-item'
								onClick={setTimeOffset.bind(null, 24 * 60)}>
								Last 24 hours
							</button>
						</div>
					</div>
					<div className='search-filter-datetime-picker__content-right'>
						{(type === TimeInputType.DATE_TIME || type === TimeInputType.DATE) && (
							<Calendar
								value={
									focusedInput === 'previousTimeLimit'
										? moment(previousTimeLimit.value).utcOffset(0)
										: focusedInput === 'nextTimeLimit'
										? moment(nextTimeLimit.value).utcOffset(0)
										: moment(value).utcOffset(0)
								}
								style={{ border: 'none', boxShadow: 'none', width: '200px' }}
								defaultValue={now}
								onSelect={change}
								onChange={change}
								showDateInput={false}
								showToday={false}
								disabledDate={getDisabledDate}
							/>
						)}
					</div>
				</div>
				<div className='search-filter-datetime-picker__action-buttons'>
					<button
						className='search-filter-datetime-picker__action-buttons__button cancel'
						onClick={handleCancelButton}>
						<span>Cancel</span>
					</button>
					<button
						className='search-filter-datetime-picker__action-buttons__button start'
						onClick={handleSearchButton}
						disabled={previousTimeLimit.value === nextTimeLimit.value}>
						<span>Start</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default SearchFilterDatetimePicker;
