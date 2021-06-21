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
import { useOutsideClickListener } from '../../../hooks/useOutsideClickListener';
import { AutocompleteList } from './AutocompleteList';

interface Props {
	className?: string;
	wrapperClassName?: string;
	inputStyle?: React.CSSProperties;
	value: string;
	setValue: (newValue: string) => void;
	readonly?: boolean;
	autoresize?: boolean;
	autocomplete: string[] | null;
	autocompleteClassName?: string;
	datalistKey?: string;
	placeholder?: string;
	submitKeyCodes?: number[];
	autofocus?: boolean;
	onSubmit: (nextValue: string) => void;
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
		setValue,
		onSubmit,
		onRemove,
		onEmptyBlur,
		onBlur = () => null,
		onFocus,
		disabled,
		autocomplete,
		autocompleteClassName,
		autoresize = true,
		readonly = false,
		datalistKey,
		autofocus,
		className = '',
		inputStyle = {},
		wrapperClassName = '',
		placeholder = '',
		submitKeyCodes = [KeyCodes.ENTER],
		anchor,
	} = props;

	const autocompleteListRef = React.useRef<HTMLDivElement>(null);

	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLElement | null>(null);

	const onClickOutside = React.useCallback(
		(e: MouseEvent) => {
			if (
				autocompleteListRef.current &&
				e.target instanceof HTMLElement &&
				autocompleteListRef.current.contains(e.target)
			) {
				e.stopImmediatePropagation();
				return;
			}

			if (value.trim().length > 0) {
				if (onEmptyBlur) {
					onEmptyBlur();
				}
				onSubmit(value);
			}
			onBlur();
			setAutocompleteAnchor(null);
		},
		[value],
	);

	useOutsideClickListener(ref, onClickOutside);

	const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
		setValue(e.target.value);
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (e.keyCode === KeyCodes.UP || e.keyCode === KeyCodes.DOWN || e.keyCode === KeyCodes.TAB) {
			e.preventDefault();
		}

		if (value.trim().length > 0 && submitKeyCodes.includes(e.keyCode)) {
			onSubmit(value.trim());
		}

		if (e.keyCode === KeyCodes.BACKSPACE && value.length < 1 && onRemove) {
			onRemove();
			e.preventDefault();
		}
	};

	const onAutocompleteSelect = React.useCallback(
		(selectedOption: string) => {
			onSubmit(selectedOption);
		},
		[setValue, onSubmit],
	);

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		readOnly: readonly,
		value,
		list: datalistKey,
		placeholder,
		disabled,
		onKeyDown,
		onChange,
		onFocus: e => {
			if (onFocus) {
				onFocus(e);
			}
			setAutocompleteAnchor(anchor || null);
		},
		autoFocus: autofocus,
		onClick: () => setAutocompleteAnchor(anchor || null),
		spellCheck: false,
	};

	React.useEffect(() => {
		if (value && !autocompleteAnchor) {
			setAutocompleteAnchor(anchor || null);
		}
	}, [value]);

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
					className={autocompleteClassName}
					ref={autocompleteListRef}
					items={autocomplete}
					value={value.trim()}
					anchor={autocompleteAnchor}
					onSelect={onAutocompleteSelect}
				/>
			)}
		</React.Fragment>
	);
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;
