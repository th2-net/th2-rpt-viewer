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
import AutocompleteInput from './AutocompleteInput';
import { stopPropagationHandler } from '../../helpers/react';
import { createBemBlock, createBemElement } from '../../helpers/styleCreators';
import KeyCodes from '../../util/KeyCodes';
import '../../styles/bubble.scss';

interface Props {
	className?: string;
	size?: 'small' | 'medium' | 'large';
	style?: React.CSSProperties;
	removeIconType?: 'default' | 'white';
	value: string;
	selectNext?: () => void;
	selectPrev?: () => void;
	isValid?: boolean;
	autocompleteVariants?: string[] | null;
	submitKeyCodes?: number[];
	onSubmit?: (nextValue: string) => void;
	onRemove: () => void;
}

export type BubbleRef = { focus: () => void };

const Bubble = React.forwardRef<BubbleRef, Props>((props, ref) => {
	const {
		value,
		selectNext,
		selectPrev,
		autocompleteVariants,
		onRemove,
		onSubmit = () => null,
		className = '',
		size = 'medium',
		removeIconType = 'default',
		isValid = true,
		style = {},
		submitKeyCodes = [KeyCodes.ENTER],
	} = props;

	const [anchor, setAnchor] = React.useState<HTMLDivElement>();
	const [isEditing, setIsEditing] = React.useState(false);
	const [currentValue, setCurrentValue] = React.useState<string>(value);
	const inputRef = React.useRef<HTMLInputElement>();
	const rootRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			if (!anchor) {
				setAnchor(rootRef.current || undefined);
			}
		}
	}, [isEditing]);

	React.useEffect(() => {
		setCurrentValue(value);

		if (value && !anchor) {
			setAnchor(rootRef.current || undefined);
		}

		return () => {
			setCurrentValue('');
		};
	}, [value]);

	React.useImperativeHandle(ref, () => ({
		focus: () => {
			setIsEditing(true);
		},
	}));

	const onBlur = () => {
		if (inputRef.current?.value === '') {
			onRemove();
		}

		setIsEditing(false);
	};

	const rootOnClick = () => {
		if (!isEditing) {
			setIsEditing(true);
		}
	};

	const inputOnSubmit = (nextValue: string) => {
		// eslint-disable-next-line no-param-reassign
		nextValue = nextValue.trim();
		setCurrentValue(nextValue);
		if (nextValue.length === 0) {
			onRemove();
			return;
		}
		onSubmit(nextValue);
		setIsEditing(false);
	};

	const bubbleSwitch: React.KeyboardEventHandler<HTMLInputElement> = e => {
		if (e.target instanceof HTMLInputElement) {
			const selectionStart = e.target.selectionStart;

			switch (e.keyCode) {
				case KeyCodes.LEFT:
					if (selectionStart === 0 && typeof selectPrev !== 'undefined') {
						selectPrev();
					}

					break;

				case KeyCodes.RIGHT:
					if (selectionStart === currentValue.length && typeof selectNext !== 'undefined') {
						selectNext();
					}

					break;
				default:
					break;
			}
		}
	};

	const rootClass = createBemBlock('bubble', size, !isValid && !isEditing ? 'invalid' : null);

	const iconClass = createBemElement('bubble', 'remove-icon', removeIconType);

	return (
		<div
			className={`${className} ${rootClass}`}
			style={style}
			onBlur={onBlur}
			onClick={rootOnClick}
			ref={rootRef}
			onKeyUp={bubbleSwitch}>
			{isEditing ? (
				<AutocompleteInput
					anchor={anchor}
					ref={inputRef}
					className='bubble__input'
					value={currentValue}
					setValue={setCurrentValue}
					onSubmit={inputOnSubmit}
					onRemove={onRemove}
					onEmptyBlur={onRemove}
					autocomplete={autocompleteVariants as string[]}
					datalistKey='bubble-autocomplete'
					submitKeyCodes={submitKeyCodes}
				/>
			) : (
				<React.Fragment>
					{!isValid && <i className='bubble__attention-sign' />}
					<span className='bubble__value'>{value}</span>
					<div className='bubble__remove'>
						<div className={iconClass} onClick={stopPropagationHandler(onRemove)} />
					</div>
				</React.Fragment>
			)}
		</div>
	);
});

Bubble.displayName = 'Bubble';
export default Bubble;
