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

import * as React from 'react';
import { FilterRowMultipleStringsConfig } from '../../../models/filter/FilterInputs';
import { removeByIndex, replaceByIndex } from '../../../helpers/array';
import Bubble from '../../util/Bubble';
import AutocompleteInput from '../../util/AutocompleteInput';
import KeyCodes from '../../../util/KeyCodes';
import { createBemElement, createStyleSelector } from '../../../helpers/styleCreators';

export default function MultipleStringFilterRow({
	config,
}: {
	config: FilterRowMultipleStringsConfig;
}) {
	const input = React.useRef<HTMLInputElement>();
	const [isFocused, setIsFocused] = React.useState(false);

	React.useEffect(() => {
		input.current?.focus();
		return () => {
			const inputValue = input.current?.value;
			if (inputValue && inputValue.trim()) {
				inputOnSubmit(inputValue);
			}
		};
	}, []);

	const valueBubbleOnChangeFor = (index: number) => (nextValue: string) => {
		config.setValues(replaceByIndex(config.values, index, nextValue));
	};

	const valueBubbleOnRemoveFor = (index: number) => () => {
		config.setValues(removeByIndex(config.values, index));
	};

	const inputOnRemove = () => {
		const { values, setValues } = config;
		if (values.length === 0) {
			return;
		}

		setValues(values.slice(0, values.length - 1));
	};

	const inputOnSubmit = (nextValue: string) => {
		const { values, setValues } = config;
		if (values.length > 0) {
			setValues([...values, nextValue]);
			return;
		}

		config.setValues([...values, nextValue]);
	};

	const rootOnClick = () => {
		input.current?.focus();
	};

	const inputRootClassName = createBemElement('filter-row', 'multiple-values');
	const filterContentClassName = createStyleSelector(
		'filter-content',
		(isFocused || config.values.length > 0) && !config.disabled ? 'active' : null,
		config.disabled ? 'disabled' : null,
	);

	return (
		<div className='filter-row'>
			{config.label && (
				<label className='filter-row__label' htmlFor={config.id}>
					{config.label}
				</label>
			)}
			<div className={filterContentClassName}>
				<div className={`${inputRootClassName} filter-row__input`} onClick={rootOnClick}>
					{config.values.map((value, index) => (
						<Bubble
							key={index}
							size='small'
							removeIconType='white'
							submitKeyCodes={[KeyCodes.SPACE, KeyCodes.ENTER]}
							className='filter__bubble'
							value={value}
							onSubmit={valueBubbleOnChangeFor(index)}
							onRemove={valueBubbleOnRemoveFor(index)}
							isValid={
								config.autocompleteList ? config.autocompleteList.includes(value) : undefined
							}
						/>
					))}
					<AutocompleteInput
						ref={input}
						placeholder={
							config.values.length === 0
								? 'Use Space to separate different words & Tab to finish'
								: ''
						}
						disabled={config.disabled}
						submitKeyCodes={[KeyCodes.SPACE, KeyCodes.ENTER]}
						className='filter-row__multiple-values-input'
						wrapperClassName='filter-row__multiple-values-input-wrapper'
						value={config.currentValue}
						autoresize
						autocomplete={config.autocompleteList}
						datalistKey={`autocomplete-${1}`}
						onSubmit={inputOnSubmit}
						onRemove={inputOnRemove}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						inputStyle={{ width: '100%' }}
					/>
				</div>
			</div>
		</div>
	);
}
