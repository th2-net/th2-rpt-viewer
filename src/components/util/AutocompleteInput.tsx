/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import AutosizeInput from 'react-input-autosize';
import { observer } from 'mobx-react-lite';
import KeyCodes from '../../util/KeyCodes';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';

interface Props {
    className?: string;
    value: string;
    readonly?: boolean;
    onlyAutocompleteValues?: boolean;
    autoresize?: boolean;
    onSubmit: (nextValue: string) => void;
    onRemove?: () => void;
	onEmptyBlur?: () => void;
    autocomplete?: string[];
    datalistKey?: string;
    placeholder?: string;
    submitKeyCodes?: number[];
}

const AutocompleteInput = React.forwardRef((props: Props, ref: any) => {
	const {
		value,
		onSubmit,
		onRemove,
		onEmptyBlur,
		autocomplete,
		autoresize = true,
		readonly = false,
		onlyAutocompleteValues = true,
		datalistKey,
		className = '',
		placeholder = '',
		submitKeyCodes = [KeyCodes.ENTER],
	} = props;

	const [currentValue, setCurrentValue] = React.useState<string>(value);

	React.useEffect(() => {
		setCurrentValue(value);
		return () => {
			setCurrentValue('');
		};
	}, [value]);

	const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
		setCurrentValue(e.target.value);
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (submitKeyCodes.includes(e.keyCode) && currentValue.length > 0) {
			if (!onlyAutocompleteValues || (autocomplete == null || autocomplete.includes(currentValue))) {
				onSubmit(currentValue);
				setCurrentValue('');
			}

			return;
		}

		if (e.keyCode === KeyCodes.BACKSPACE && currentValue.length < 1 && onRemove) {
			onRemove();
			e.preventDefault();
		}
	};

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		readOnly: readonly,
		value: currentValue,
		list: datalistKey,
		placeholder,
		onKeyDown,
		onChange,
		onBlur: () => {
			if (currentValue.trim()) {
				if (onEmptyBlur) {
					onEmptyBlur();
				}
				onSubmit(currentValue);
				setCurrentValue('');
			}
		},
	};

	return (
		<React.Fragment>
			{
				autoresize ? (
					<AutosizeInput
						{...inputProps}
						inputRef={input => {
							// eslint-disable-next-line no-param-reassign
							ref.current = input as HTMLInputElement;
						}}
						inputClassName={className}
					/>
				) : (
					<input
						{...inputProps}
						ref={ref}
						className={className}
					/>
				)
			}
			{
				currentValue.length > 0
				&& (
					<datalist id={datalistKey}>
						{
							autocomplete?.map((variant, index) => (
								<option key={index} value={variant}/>
							))
						}
					</datalist>
				)
			}
		</React.Fragment>
	);
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;
