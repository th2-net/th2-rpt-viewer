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
import { createBemBlock, createBemElement } from 'helpers/styleCreators';

export interface RadioProps<T extends string> {
	checked: boolean;
	name: string;
	value: T;
	id: string;
	label?: string;
	isDisabled?: boolean;
	className?: string;
	onChange: (value: T) => void;
}

export default function Radio<T extends string>({
	checked,
	label,
	name,
	value,
	onChange,
	isDisabled = false,
	className = '',
	id = '',
}: RadioProps<T>) {
	const disabledModifier = isDisabled ? 'disabled' : null;
	const checkedModifier = checked ? 'checked' : null;
	const rootClassName = createBemBlock(className, disabledModifier, checkedModifier);
	const inputClassName = createBemElement(className, 'input', disabledModifier, checkedModifier);
	const labelClassName = createBemElement(
		className,
		'label',
		value,
		disabledModifier,
		checkedModifier,
	);
	return (
		<div className={rootClassName}>
			<input
				className={inputClassName}
				type='radio'
				id={id}
				checked={checked}
				name={name}
				onChange={() => onChange(value)}
			/>
			<label className={labelClassName} htmlFor={id} title={value}>
				{label}
			</label>
		</div>
	);
}
