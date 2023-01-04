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

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import MaskedInput from 'react-text-mask';
import moment from 'moment';
import { CalendarIcon } from 'components/icons/CalendarIcon';
import { IconButton } from 'components/buttons/IconButton';
import { useOutsideClickListener } from 'hooks/useOutsideClickListener';
import FilterDatetimePicker from './FilterDatetimePicker';
import { DateTimeInputType } from '../../../models/filter/FilterInputs';
import { formatTimestampValue } from '../../../helpers/date';
import { replaceUnfilledDateStringWithMinValues } from '../../../helpers/stringUtils';

interface DateTimeInputProps {
	inputConfig: DateTimeInputType;
}

const DatetimeInput = (props: DateTimeInputProps) => {
	const {
		inputConfig,
		inputConfig: {
			dateMask,
			id,
			inputClassName = '',
			inputMask,
			placeholder,
			setValue,
			value,
			disabled,
		},
	} = props;

	const inputRef = useRef<MaskedInput>(null);
	const rootRef = useRef<HTMLDivElement>(null);

	const [showPicker, setShowPicker] = useState(false);
	const [inputValue, setInputValue] = useState(formatTimestampValue(value, dateMask));
	const [isFocused, setIsFocused] = useState(false);

	const isActive = showPicker || isFocused;

	React.useEffect(() => {
		setInputValue(formatTimestampValue(props.inputConfig.value, dateMask));
	}, [props.inputConfig.value]);

	const togglePicker = () => setShowPicker(o => !o);
	const closePicker = () => setShowPicker(false);

	const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value: updatedValue } = e.target;
		setInputValue(updatedValue);

		if (updatedValue) {
			if (!updatedValue.includes('_')) {
				setValue(moment.utc(updatedValue, dateMask).valueOf());
			}
			return;
		}
		setValue(null);
	};

	const isValidDate = (maskedValue: string): boolean => {
		const dateStr = replaceUnfilledDateStringWithMinValues(maskedValue, dateMask);
		const date = moment(dateStr, dateMask);

		return date.isValid();
	};

	const validPipe = (maskedValue: string): string | false => {
		if (isValidDate(maskedValue)) {
			return maskedValue;
		}
		return false;
	};

	useOutsideClickListener(rootRef, (e: MouseEvent) => {
		if (showPicker && e.target instanceof Node && !rootRef.current?.contains(e.target)) {
			closePicker();
		}
	});

	return (
		<div className={clsx('date-time-input', { active: isActive })} ref={rootRef}>
			{inputConfig.label && (
				<label htmlFor={inputConfig.id} className={inputConfig.labelClassName}>
					{inputConfig.label}
				</label>
			)}
			<MaskedInput
				ref={inputRef}
				id={id}
				className={clsx('filter-row__input', inputClassName)}
				disabled={disabled}
				mask={inputMask}
				pipe={validPipe}
				onChange={inputChangeHandler}
				placeholder={placeholder}
				keepCharPositions={true}
				autoComplete='off'
				name={id}
				value={inputValue}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			/>
			<IconButton onClick={togglePicker}>
				<CalendarIcon className='events-nav__calendar-button' />
			</IconButton>
			{showPicker && (
				<FilterDatetimePicker
					setValue={inputConfig.setValue}
					value={inputConfig.value}
					type={inputConfig.type}
					left={inputRef.current?.inputElement.offsetLeft}
					top={
						inputRef.current?.inputElement
							? inputRef.current.inputElement.offsetTop +
							  inputRef.current.inputElement.clientHeight +
							  4
							: undefined
					}
					onClose={togglePicker}
				/>
			)}
		</div>
	);
};

export default DatetimeInput;
