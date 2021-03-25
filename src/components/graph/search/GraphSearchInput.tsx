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
import moment from 'moment';
import KeyCodes from '../../../util/KeyCodes';
import { createBemElement } from '../../../helpers/styleCreators';
import { usePointerTimestamp } from '../../../contexts/pointerTimestampContext';

const TIME_MASK = 'HH:mm:ss.SSS' as const;
export const DATE_TIME_MASK = 'YYYY.MM.DD HH:mm:ss.SSS' as const;
const TIME_PLACEHOLDER = '00:00:00.000' as const;
const DATE_TIME_PLACEHOLDER = '0000.01.01 00:00:00.000' as const;

// eslint-disable-next-line max-len
const dateRegexp = /\d{4}(-|\.)(0?[1-9]|1[012])(-|\.)(0?[1-9]|[12][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])\.\d{3}/g;

const isCompletable = (
	dateStr: string,
	dateMask: typeof TIME_MASK | typeof DATE_TIME_MASK,
): boolean => {
	return new RegExp(
		dateMask
			.split('')
			.slice(0, dateStr.length)
			.map(char => (/[a-zA-Z0-9]/gi.test(char) ? '\\d' : char))
			.join(''),
		'gi',
	).test(dateStr);
};

const replaceBlankTimeCharsWithDefaults = (
	dateStr: string,
	dateMask: typeof TIME_MASK | typeof DATE_TIME_MASK,
	placeholder: typeof TIME_PLACEHOLDER | typeof DATE_TIME_PLACEHOLDER,
) => {
	if (isCompletable(dateStr, dateMask)) {
		return dateStr + placeholder.slice(dateStr.length);
	}
	return null;
};

interface Props {
	toggleTimePicker: (isOpen: boolean) => void;
	toggleHistory: (isOpen: boolean) => void;
	setTimestamp: (ts: null | number) => void;
	timestamp: number | null;
	onSubmit: (value: number | string) => void;
}

export interface GraphSearchInputConfig {
	isValid: boolean;
	value: string;
	timestamp: number | null;
	placeholder: typeof TIME_PLACEHOLDER | typeof DATE_TIME_PLACEHOLDER | null;
	mask: typeof TIME_MASK | typeof DATE_TIME_MASK | null;
}

function GraphSearchInput(props: Props) {
	const { toggleTimePicker, toggleHistory, timestamp, setTimestamp, onSubmit } = props;

	const pointerTimestamp = usePointerTimestamp();

	const previousPointerTimestamp = React.useRef<number | null>(pointerTimestamp);
	const savedInputConfig = React.useRef<GraphSearchInputConfig | null>(null);

	const [inputConfig, setInputConfig] = React.useState<GraphSearchInputConfig>({
		isValid: false,
		mask: null,
		placeholder: null,
		timestamp: null,
		value: '',
	});

	React.useEffect(() => {
		if (timestamp !== null && timestamp !== inputConfig.timestamp) {
			const mask = inputConfig.mask || DATE_TIME_MASK;
			const placeholder = inputConfig.placeholder || DATE_TIME_PLACEHOLDER;

			setInputConfig({
				...inputConfig,
				value: moment.utc(timestamp).format(mask),
				mask,
				placeholder,
				timestamp,
				isValid: true,
			});
		}
	}, [timestamp]);

	React.useEffect(() => {
		const mask = inputConfig.mask || DATE_TIME_MASK;
		const placeholder = inputConfig.placeholder || DATE_TIME_PLACEHOLDER;

		if (previousPointerTimestamp.current === null && pointerTimestamp !== null) {
			savedInputConfig.current = inputConfig;
		}

		if (
			previousPointerTimestamp.current !== null &&
			pointerTimestamp === null &&
			savedInputConfig.current
		) {
			setInputConfig(savedInputConfig.current);
		} else if (pointerTimestamp !== null) {
			setInputConfig({
				...inputConfig,
				value: pointerTimestamp
					? moment.utc(pointerTimestamp).format(mask)
					: timestamp
					? moment.utc(timestamp).format(mask)
					: '',
				mask,
				placeholder,
				timestamp,
				isValid: true,
			});
		}
		previousPointerTimestamp.current = pointerTimestamp;
	}, [pointerTimestamp]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		const { mask, value, placeholder } = inputConfig;
		if (e.keyCode === KeyCodes.ENTER) {
			toggleHistory(false);
			toggleTimePicker(false);
			if (value.match(dateRegexp)) {
				const time = moment.utc(value).valueOf();
				setTimestamp(time);
				onSubmit(time);
			}
		}

		if (e.keyCode === KeyCodes.TAB) {
			e.preventDefault();
			if (mask && isCompletable(value, mask) && placeholder) {
				const fullDate = replaceBlankTimeCharsWithDefaults(value, mask, placeholder);
				const completedTimestamp = moment.utc(fullDate, mask);
				if (fullDate !== null && completedTimestamp.isValid()) {
					setInputConfig({
						...inputConfig,
						value: fullDate,
						isValid: true,
						timestamp: completedTimestamp.valueOf(),
					});
					setTimestamp(completedTimestamp.valueOf());
				}
			}
		}
	}

	function handleInputValueChange(event: React.ChangeEvent<HTMLInputElement>) {
		const value = event.target.value;
		onSubmit('');
		if (value) {
			toggleHistory(false);
		} else {
			toggleHistory(true);
		}

		const replacedTime = replaceBlankTimeCharsWithDefaults(value, TIME_MASK, TIME_PLACEHOLDER);
		const parsedTime = moment.utc(replacedTime, TIME_MASK, true);

		const replacedDate = replaceBlankTimeCharsWithDefaults(
			value,
			DATE_TIME_MASK,
			DATE_TIME_PLACEHOLDER,
		);
		const parsedDate = moment.utc(replacedDate, DATE_TIME_MASK, true);

		if (value.length > 2 && isCompletable(value, TIME_MASK) && parsedTime.isValid()) {
			setInputConfig({
				isValid: value.length === TIME_MASK.length && moment(value, TIME_MASK).isValid(),
				mask: TIME_MASK,
				placeholder: TIME_PLACEHOLDER,
				timestamp: parsedTime.valueOf(),
				value,
			});
			setTimestamp(parsedTime.valueOf());
			toggleTimePicker(true);
		} else if (value.length > 4 && isCompletable(value, DATE_TIME_MASK) && parsedDate.isValid()) {
			setInputConfig({
				isValid: value.length === DATE_TIME_MASK.length && moment(value, DATE_TIME_MASK).isValid(),
				mask: DATE_TIME_MASK,
				placeholder: DATE_TIME_PLACEHOLDER,
				timestamp: parsedDate.valueOf(),
				value,
			});
			setTimestamp(parsedDate.valueOf());
			toggleTimePicker(true);
		} else {
			setInputConfig({
				isValid: false,
				mask: null,
				placeholder: null,
				timestamp: null,
				value,
			});
			toggleTimePicker(false);
			setTimestamp(null);
		}
	}

	function onInputFocus() {
		if (!inputConfig.value) {
			toggleHistory(true);
		} else if (
			isCompletable(inputConfig.value, DATE_TIME_MASK) ||
			isCompletable(inputConfig.value, TIME_MASK)
		) {
			toggleTimePicker(true);
		}
	}

	function toggleDatepicker() {
		if (!inputConfig.value) {
			setTimestamp(moment.utc().valueOf());
		}
		toggleTimePicker(true);
	}

	const datepickerButtonClassName = createBemElement('graph-search-input', 'datepicker-button');

	return (
		<div className='graph-search-input'>
			<input
				value={inputConfig.value}
				onChange={handleInputValueChange}
				className='graph-search-input__input'
				onFocus={onInputFocus}
				onKeyDown={handleKeyDown}
				type='text'
			/>
			<input
				className='graph-search-input__placeholder'
				type='text'
				readOnly={true}
				value={
					inputConfig.placeholder
						? inputConfig.value + inputConfig.placeholder.slice(inputConfig.value.length)
						: ''
				}
			/>
			<button className={datepickerButtonClassName} onClick={toggleDatepicker} />
		</div>
	);
}

export default React.memo(GraphSearchInput);
