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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import AutosizeInput from 'react-input-autosize';
import KeyCodes from '../../util/KeyCodes';

interface Props {
	className?: string;
	wrapperClassName?: string;
	inputStyle?: React.CSSProperties;
	value: string;
	readonly?: boolean;
	onlyAutocompleteValues?: boolean;
	autoresize?: boolean;
	autocomplete: string[] | null;
	datalistKey?: string;
	placeholder?: string;
	submitKeyCodes?: number[];
	onSubmit: (nextValue: string) => void;
	onRemove?: () => void;
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onEmptyBlur?: () => void;
}

const AutocompleteInput = React.forwardRef((props: Props, ref: any) => {
	const {
		value,
		onSubmit,
		onRemove,
		onEmptyBlur,
		onBlur = () => null,
		onFocus,
		autocomplete,
		autoresize = true,
		readonly = false,
		onlyAutocompleteValues = true,
		datalistKey,
		className = '',
		inputStyle = {},
		wrapperClassName = '',
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
		if (autocomplete?.includes(e.target.value)) {
			onSubmit(e.target.value);
			setCurrentValue('');
		} else {
			setCurrentValue(e.target.value);
		}
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (!currentValue.trim() && e.keyCode !== KeyCodes.BACKSPACE) {
			setCurrentValue('');
			return;
		}

		if (submitKeyCodes.includes(e.keyCode) && currentValue.length > 0) {
			if (!onlyAutocompleteValues) {
				onSubmit(currentValue);
				setCurrentValue('');
			} else if (autocomplete !== null && autocomplete.includes(currentValue)) {
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
		onFocus,
		onBlur: e => {
			if (currentValue.trim().length > 0) {
				if (!onlyAutocompleteValues) {
					if (onEmptyBlur) {
						onEmptyBlur();
					}
				} else if (autocomplete !== null && autocomplete.includes(currentValue)) {
					if (onEmptyBlur) {
						onEmptyBlur();
					}
					onSubmit(currentValue);
				}
			}

			setCurrentValue('');
			onBlur(e);
		},
	};

	const autocompleteList = React.useMemo(
		() => autocomplete?.filter(variant => variant.indexOf(currentValue) === 0),
		[currentValue],
	);

	return (
		<React.Fragment>
			{autoresize ? (
				<AutosizeInput
					className={wrapperClassName}
					{...inputProps}
					inputRef={input => {
						// eslint-disable-next-line no-param-reassign
						ref.current = input as HTMLInputElement;
					}}
					inputClassName={className}
					inputStyle={inputStyle}
				/>
			) : (
				<input {...inputProps} ref={ref} className={className} />
			)}
			{currentValue.length > 0 && (
				<datalist id={datalistKey}>
					{autocompleteList &&
						autocompleteList.length <= 100 &&
						autocompleteList?.map((variant, index) => <option key={index} value={variant} />)}
				</datalist>
			)}
		</React.Fragment>
	);
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;
