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
import { Override } from '../../../util/types';

type Props = Override<
	React.InputHTMLAttributes<HTMLInputElement>,
	{ onSubmit: (nextValue: string) => void; value: string; onBlur?: () => void }
> & {
	wrapperClassName?: string;
	inputStyle?: React.CSSProperties;
	setValue: (newValue: string) => void;
	autoresize?: boolean;
	alwaysShowAutocomplete?: boolean;
	autocompleteList?: string[];
	autocompleteClassName?: string;
	datalistKey?: string;
	submitKeyCodes?: number[];
	onRemove?: () => void;
	onEmptyBlur?: () => void;
	anchor?: HTMLElement;
	autocompleteListMinWidth?: number;
	closedOnClick?: boolean;
	isBubbleEditing?: boolean;
	outerInputRef?: React.MutableRefObject<HTMLInputElement | undefined>;
};

const AutocompleteInput = React.forwardRef((props: Props, ref: any) => {
	const {
		onKeyDown: onKeyDownProp,
		value = '',
		setValue,
		onSubmit,
		onRemove,
		onEmptyBlur,
		onFocus,
		autocompleteList,
		autocompleteClassName,
		autoresize = true,
		spellCheck = false,
		closedOnClick,
		datalistKey,
		className = '',
		inputStyle = {},
		wrapperClassName = '',
		submitKeyCodes = [KeyCodes.ENTER],
		anchor,
		alwaysShowAutocomplete,
		autocompleteListMinWidth,
		isBubbleEditing,
		outerInputRef,
		...lastInputProps
	} = props;

	const autocompleteListRef = React.useRef<HTMLDivElement>(null);

	const selectedOptionRef = React.useRef<string | null>(null);

	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLElement | null>(null);

	const isFocused = Boolean(autocompleteAnchor);

	const onClickOutside = React.useCallback(
		(e: MouseEvent) => {
			if (!isFocused) return;
			if (
				autocompleteListRef.current &&
				e.target instanceof HTMLElement &&
				autocompleteListRef.current.contains(e.target)
			) {
				e.stopImmediatePropagation();
				return;
			}

			if (value.trim().length > 0) {
				onSubmit(value);
			}
			setAutocompleteAnchor(null);
		},
		[value, isFocused, onSubmit],
	);

	useOutsideClickListener(ref, onClickOutside);

	const onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
		setValue(e.target.value);
		selectedOptionRef.current = null;
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (typeof onKeyDownProp !== 'undefined') onKeyDownProp(e);
		if (e.keyCode === KeyCodes.UP || e.keyCode === KeyCodes.DOWN || e.keyCode === KeyCodes.TAB) {
			e.preventDefault();
		}

		if (value.trim().length > 0 && submitKeyCodes.includes(e.keyCode)) {
			if (outerInputRef) {
				outerInputRef.current?.focus();
			}
			onSubmit(value.trim());
		}

		if (e.keyCode === KeyCodes.BACKSPACE && value.length === 0 && onRemove) {
			onRemove();
			e.preventDefault();
		}
	};

	const onAutocompleteSelect = React.useCallback(
		(selectedOption: string) => {
			onSubmit(selectedOption);
			if (closedOnClick) {
				setAutocompleteAnchor(null);
			}
			selectedOptionRef.current = selectedOption;
		},
		[setValue, onSubmit],
	);

	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		...lastInputProps,
		value,
		list: datalistKey,
		onKeyDown,
		onChange,
		onFocus: e => {
			onFocus?.(e);
			setAutocompleteAnchor(anchor || null);
		},
		onClick: () => setAutocompleteAnchor(anchor || null),
		spellCheck,
	};

	React.useEffect(() => {
		if (value && !autocompleteAnchor && selectedOptionRef.current !== value) {
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
			{autocompleteList && autocompleteList.length > 0 && (outerInputRef || !isBubbleEditing) && (
				<AutocompleteList
					className={autocompleteClassName}
					ref={autocompleteListRef}
					items={autocompleteList}
					value={value.trim()}
					anchor={autocompleteAnchor}
					onSelect={onAutocompleteSelect}
					alwaysShow={isFocused && alwaysShowAutocomplete}
					minWidth={autocompleteListMinWidth}
				/>
			)}
		</React.Fragment>
	);
});

AutocompleteInput.displayName = 'AutocompleteInput';

export default AutocompleteInput;
