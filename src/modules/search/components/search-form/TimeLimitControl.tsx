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

import moment from 'moment';
import React, { useRef, useState, Fragment } from 'react';
import { createBemBlock, createBemElement } from 'helpers/styleCreators';

type Props = {
	value: number | null;
	setValue: (nextValue: number | null) => void;
	disabled: boolean;
	showError: boolean;
	errorPosition: 'left' | 'right';
	errorTextRows: string[];
	hidden?: boolean;
	readonly?: boolean;
};

const TimeLimitControl = ({
	value,
	setValue,
	disabled,
	showError,
	errorPosition = 'left',
	errorTextRows,
	hidden = false,
	readonly = false,
}: Props) => {
	const [showPicker, togglePicker] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	const datetime = moment(value).utc();

	const handleRootClick = () => {
		if (!showPicker && !disabled && !hidden && !readonly) {
			togglePicker(true);
		}
	};

	const handleClearClick = (event: React.MouseEvent) => {
		setValue(null);
		event.stopPropagation();
	};

	const rootClassName = createBemBlock(
		'search-time-limit',
		!disabled && !readonly ? 'hoverable' : null,
		disabled ? 'disabled' : null,
		showPicker ? 'active' : null,
		hidden ? 'hidden' : null,
	);

	const errorClassName = createBemElement(
		'search-time-limit',
		'error',
		showError ? null : 'hidden',
		errorPosition,
	);

	return (
		<>
			<div className={rootClassName} onClick={handleRootClick} ref={rootRef}>
				{value ? (
					<>
						<div className='search-time-limit__datetime'>
							<div className='search-time-limit__date'>{datetime.format('DD.MM.YYYY')}</div>
							<div className='search-time-limit__time'>{datetime.format('HH:mm:ss')}</div>
						</div>
						<div className='search-time-limit__clear' onClick={handleClearClick} />
					</>
				) : (
					<div className='search-time-limit__infinite' />
				)}
				<div className={errorClassName}>
					{errorTextRows.map(errorText => (
						<Fragment key={errorText}>
							{errorText}
							<br />
						</Fragment>
					))}
				</div>
			</div>
		</>
	);
};

export default TimeLimitControl;
