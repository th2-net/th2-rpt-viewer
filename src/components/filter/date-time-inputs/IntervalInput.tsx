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
import { IntervalInputType } from 'models/filter/FilterInputs';
import { createStyleSelector } from 'helpers/styleCreators';

interface DateTimeInputProps {
	inputConfig: IntervalInputType;
}

const IntervalInput = ({ inputConfig }: DateTimeInputProps) => {
	const { id, inputMask, placeholder, value, setValue, inputClassName } = inputConfig;

	const [inputValue, setInputValue] = React.useState(value ? value.toString() : '');

	React.useEffect(() => {
		setInputValue(value ? value.toString() : '');
	}, [value]);

	const maskedInputClassName = createStyleSelector(
		inputClassName || '',
		value ? 'non-empty' : null,
	);

	const validate = (validatedValue: string) => {
		if (inputMask.test(validatedValue)) {
			setInputValue(validatedValue);
			setValue(Number(validatedValue));
		}
	};

	return (
		<input
			type='text'
			className={`filter-row__input ${maskedInputClassName}`}
			id={id}
			value={inputValue}
			onChange={e => validate(e.target.value)}
			placeholder={placeholder}
			autoComplete='off'
		/>
	);
};

export default IntervalInput;
