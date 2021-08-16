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
import AutocompleteInput from '../../util/AutocompleteInput/AutocompleteInput';
import KeyCodes from '../../../util/KeyCodes';
import {
	createBemBlock,
	createBemElement,
	createStyleSelector,
} from '../../../helpers/styleCreators';

interface MultipleStringFilterRowProps {
	config: FilterRowMultipleStringsConfig;
}

export default function MultipleStringFilterRow({ config }: MultipleStringFilterRowProps) {
	const input = React.useRef<HTMLInputElement>();
	const bubbleRef = React.useRef<HTMLInputElement>();
	const rootRef = React.useRef<HTMLDivElement>(null);
	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLDivElement>();

	const [isFocused, setIsFocused] = React.useState(false);

	React.useLayoutEffect(() => {
		setAutocompleteAnchor(rootRef.current || undefined);
	}, [setAutocompleteAnchor]);

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
		// eslint-disable-next-line no-param-reassign
		nextValue = nextValue.trim();
		const { values, setValues, setCurrentValue } = config;
		setCurrentValue('');
		if (values.length > 0) {
			setValues([...values, nextValue]);
			return;
		}
		setValues([...values, nextValue]);
	};

	const rootOnClick = () => {
		input.current?.focus();
	};

	const focusBubble: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (e.keyCode === KeyCodes.LEFT) {
			bubbleRef.current?.focus();
		}
		if (e.keyCode === KeyCodes.RIGHT) {
			input.current?.focus();
		}
	};

	const inputRootClassName = createBemElement(
		'filter-row',
		'multiple-values',
		'filter-row__input',
		config.isInvalid ? 'invalid' : null,
	);

	const filterContentClassName = createStyleSelector(
		'filter-content',
		(isFocused || config.values.length > 0) && !config.disabled ? 'active' : null,
		config.disabled ? 'disabled' : null,
	);
	const wrapperClassName = createBemBlock('filter-row', config.wrapperClassName || null);
	const labelClassName = createStyleSelector('filter-row__label', config.labelClassName || null);

	return (
		<div className={wrapperClassName}>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			<div className={filterContentClassName} ref={rootRef}>
				<div className={inputRootClassName} onClick={rootOnClick} onKeyDown={focusBubble}>
					{config.values.map((value, index) => (
						<Bubble
							ref={bubbleRef}
							key={index}
							size='small'
							removeIconType='white'
							submitKeyCodes={[KeyCodes.TAB]}
							className='filter__bubble'
							value={value}
							onSubmit={valueBubbleOnChangeFor(index)}
							onRemove={valueBubbleOnRemoveFor(index)}
							autocompleteVariants={config.autocompleteList}
							isValid={
								config.validateBubbles
									? config.autocompleteList
										? config.autocompleteList.includes(value.trim())
										: undefined
									: undefined
							}
						/>
					))}

					<AutocompleteInput
						anchor={autocompleteAnchor}
						ref={input}
						placeholder={
							config.values.length === 0
								? config.hint ||
								  `${config.required ? 'Required. ' : ''}Use Tab to separate different words`
								: ''
						}
						disabled={config.disabled}
						submitKeyCodes={[KeyCodes.TAB]}
						className='filter-row__multiple-values-input'
						wrapperClassName='filter-row__multiple-values-input-wrapper'
						value={config.currentValue}
						setValue={config.setCurrentValue}
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
