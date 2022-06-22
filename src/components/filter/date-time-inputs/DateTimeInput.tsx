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
import SearchFilterDatetimePicker from './SearchFilterDatetimePicker';
import FilterDatetimePicker from './FilterDatetimePicker';
import { DateTimeInputType } from '../../../models/filter/FilterInputs';
import { formatTimestampValue } from '../../../helpers/date';
import { createStyleSelector } from '../../../helpers/styleCreators';
import { replaceUnfilledDateStringWithMinValues } from '../../../helpers/stringUtils';
import { useSearchStore } from '../../../hooks/useSearchStore';
import { SearchDirection } from '../../../models/search/SearchDirection';

interface DateTimeInputProps {
	inputConfig: DateTimeInputType;
	previousTimeLimit?: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	nextTimeLimit?: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
}

const FilterDatetimeInput = (props: DateTimeInputProps) => {
	const {
		inputConfig,
		inputConfig: {
			dateTimeMask,
			dateMask,
			timeMask,
			id,
			inputClassName = '',
			dateTimeInputMask,
			timeInputMask,
			timestampsInputMask,
			placeholder,
			setValue,
			value,
			disabled,
		},
		previousTimeLimit,
		nextTimeLimit,
	} = props;

	const inputRef = React.useRef<MaskedInput>(null);

	const { updateForm, isSearching, startSearch, pauseSearch } = useSearchStore();

	const [showPicker, setShowPicker] = React.useState(false);
	const [inputValue, setInputValue] = React.useState(formatTimestampValue(value, dateTimeMask));

	React.useEffect(() => {
		setInputValue(formatTimestampValue(props.inputConfig.value, dateTimeMask));
	}, [props.inputConfig.value]);

	const togglePicker = (isShown: boolean) => setShowPicker(isShown);

	const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { value: updatedValue } = e.target;
		setInputValue(updatedValue);

		if (updatedValue) {
			if (!updatedValue.includes('_')) {
				setValue(moment.utc(updatedValue, dateTimeMask).valueOf());
				updateForm({ searchDirection: SearchDirection.Both });
			}
			return;
		}
		setValue(null);
	};
	const isValidDateTime = (maskedValue: string): boolean =>
		moment(
			replaceUnfilledDateStringWithMinValues(maskedValue, dateTimeMask),
			dateTimeMask,
		).isValid();

	const dateTimePipe = (maskedValue: string): string | false => {
		if (isValidDateTime(maskedValue)) {
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
				mask={dateTimeInputMask}
				pipe={dateTimePipe}
				onFocus={() => togglePicker(true)}
				onChange={inputChangeHandler}
				placeholder={placeholder}
				keepCharPositions={true}
				autoComplete='off'
				name={id}
				value={inputValue}
			/>
			{previousTimeLimit && nextTimeLimit
				? showPicker && (
						<SearchFilterDatetimePicker
							setValue={inputConfig.setValue}
							value={inputConfig.value}
							isSearching={isSearching}
							startSearch={startSearch}
							pauseSearch={pauseSearch}
							updateForm={updateForm}
							type={inputConfig.type}
							inputValue={inputValue}
							id={inputConfig.id}
							inputClassName={inputClassName}
							disabled={disabled}
							dateTimeMask={dateTimeMask}
							dateMask={dateMask}
							timeMask={timeMask}
							dateTimeInputMask={dateTimeInputMask}
							timeInputMask={timeInputMask}
							timestampsInputMask={timestampsInputMask}
							dateTimePipe={dateTimePipe}
							previousTimeLimit={previousTimeLimit}
							nextTimeLimit={nextTimeLimit}
							inputChangeHandler={inputChangeHandler}
							placeholder={placeholder}
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
				  )
				: showPicker && (
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

export default FilterDatetimeInput;
