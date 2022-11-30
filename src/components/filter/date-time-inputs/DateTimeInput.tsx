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
import MaskedInput from 'react-text-mask';
import moment from 'moment';
import FilterDatetimePicker from './FilterDatetimePicker';
import { DateTimeInputType } from '../../../models/filter/FilterInputs';
import { formatTimestampValue } from '../../../helpers/date';
import { createStyleSelector } from '../../../helpers/styleCreators';
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

	const inputRef = React.useRef<MaskedInput>(null);

	const [showPicker, setShowPicker] = React.useState(false);
	const [inputValue, setInputValue] = React.useState(formatTimestampValue(value, dateMask));

	React.useEffect(() => {
		setInputValue(formatTimestampValue(props.inputConfig.value, dateMask));
	}, [props.inputConfig.value]);

	const togglePicker = (isShown: boolean) => setShowPicker(isShown);

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

	const maskedInputClassName = createStyleSelector(inputClassName, value ? 'non-empty' : null);

	return (
		<>
			<MaskedInput
				ref={inputRef}
				id={id}
				className={`filter-row__input ${maskedInputClassName}`}
				disabled={disabled}
				mask={inputMask}
				pipe={validPipe}
				onFocus={() => togglePicker(true)}
				onChange={inputChangeHandler}
				placeholder={placeholder}
				keepCharPositions={true}
				autoComplete='off'
				name={id}
				value={inputValue}
			/>
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
							  10
							: undefined
					}
					onClose={() => togglePicker(false)}
				/>
			)}
		</>
	);
};

export default DatetimeInput;
