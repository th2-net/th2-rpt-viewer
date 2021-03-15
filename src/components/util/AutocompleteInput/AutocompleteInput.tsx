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
import KeyCodes from '../../../util/KeyCodes';
import { useOutsideClickListener } from '../../../hooks';
import { AutocompleteList } from './AutocompleteList';

interface Props {
	className?: string;
	wrapperClassName?: string;
	inputStyle?: React.CSSProperties;
	value: string;
	readonly?: boolean;
	autoresize?: boolean;
	autocomplete: string[] | null;
	datalistKey?: string;
	placeholder?: string;
	submitKeyCodes?: number[];
	onSubmit: (nextValue: string) => void;
	notResetOnSubmit?: boolean;
	onRemove?: () => void;
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	onBlur?: () => void;
	onEmptyBlur?: () => void;
	disabled?: boolean;
	anchor?: HTMLElement;
}

const AutocompleteInput = React.forwardRef((props: Props, ref: any) => {
	const {
		value,
		onSubmit,
		notResetOnSubmit,
		onRemove,
		onEmptyBlur,
		onBlur = () => null,
		onFocus,
		disabled,
		autocomplete,
		autoresize = true,
		readonly = false,
		datalistKey,
		className = '',
		inputStyle = {},
		wrapperClassName = '',
		placeholder = '',
		submitKeyCodes = [KeyCodes.ENTER],
		anchor,
	} = props;

	const [currentValue, setCurrentValue] = React.useState<string>(value);
	const autocompleteListRef = React.useRef<HTMLDivElement>(null);

	useOutsideClickListener(ref, e => {
		if (
			autocompleteListRef.current &&
			e.target instanceof HTMLElement &&
			autocompleteListRef.current.contains(e.target)
		)
			return;

		if (currentValue.trim().length > 0) {
			if (onEmptyBlur) {
				onEmptyBlur();
			}
			onSubmit(currentValue);
		}

		setCurrentValue('');
		onBlur();
	});

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
		if (e.keyCode === KeyCodes.UP) {
			e.preventDefault();
		}

		if (!currentValue.trim() && e.keyCode !== KeyCodes.BACKSPACE) {
			setCurrentValue('');
			return;
		}

		if (submitKeyCodes.includes(e.keyCode) && currentValue.length > 0) {
			onSubmit(currentValue);
			if (!notResetOnSubmit) {
				setCurrentValue('');
			}
			return;
		}

		if (e.keyCode === KeyCodes.BACKSPACE && currentValue.length < 1 && onRemove) {
			onRemove();
			e.preventDefault();
		}
	};

	const onAutocompleteSelect = React.useCallback(
		(selectedOption: string) => {
			setCurrentValue('');
			onSubmit(selectedOption);
		},
		[setCurrentValue, onSubmit],
	);

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		readOnly: readonly,
		value: currentValue,
		list: datalistKey,
		placeholder,
		disabled,
		onKeyDown,
		onChange,
		onFocus,
		autoFocus: false,
	};

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
			{autocomplete && autocomplete.length > 0 && (
				<AutocompleteList
					ref={autocompleteListRef}
					items={autocomplete}
					value={currentValue.trim()}
					anchor={anchor || null}
					onSelect={onAutocompleteSelect}
				/>
			)}
		</React.Fragment>
	);
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;
