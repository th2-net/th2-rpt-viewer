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
import { GlobalHotKeys } from 'react-hotkeys';
import { useRef } from 'react';
import KeyCodes from '../../../util/KeyCodes';
import { usePointerTimestamp } from '../../../contexts/pointerTimestampContext';
import { GraphSearchMode } from './GraphSearch';
import { DateTimeMask } from '../../../models/filter/FilterInputs';
import { TimeRange } from '../../../models/Timestamp';
import { usePrevious } from '../../../hooks';

const TIME_MASK = DateTimeMask.TIME_MASK;
export const DATE_TIME_MASK = DateTimeMask.DATE_TIME_MASK;

const TIME_PLACEHOLDER = '00:00:00.000' as const;
const DATE_TIME_PLACEHOLDER = '01.01.2021 00:00:00.000' as const;

type KeyboardHandler = {
	[key: string]: (keyEvent?: KeyboardEvent | undefined) => void;
};

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

export interface GraphSearchInputConfig {
	isValidDate: boolean;
	value: string;
	timestamp: number | null;
	placeholder: typeof TIME_PLACEHOLDER | typeof DATE_TIME_PLACEHOLDER | null;
	mask: typeof TIME_MASK | typeof DATE_TIME_MASK | null;
}

interface Props {
	setTimestamp: (ts: null | number) => void;
	timestamp: number | null;
	mode: GraphSearchMode;
	setMode: (mode: GraphSearchMode) => void;
	inputConfig: GraphSearchInputConfig;
	setInputConfig: (config: GraphSearchInputConfig) => void;
	windowRange: TimeRange | null;
	hoveredTimestamp: number | null;
	submitTimestamp: (timestamp: number) => void;
}

function GraphSearchInput(props: Props) {
	const {
		timestamp,
		setTimestamp,
		setMode,
		inputConfig,
		setInputConfig,
		mode,
		windowRange,
		hoveredTimestamp,
		submitTimestamp,
	} = props;

	const pointerTimestamp = usePointerTimestamp();

	const previousPointerTimestamp = React.useRef<number | null>(pointerTimestamp);
	const savedInputConfig = React.useRef<GraphSearchInputConfig | null>(null);

	React.useEffect(() => {
		if (timestamp !== null && timestamp !== inputConfig.timestamp) {
			const updatedTimestamp = moment.utc(timestamp);

			const isToday = updatedTimestamp.isSame(moment.utc(), 'day');

			const mask = isToday ? TIME_MASK : DATE_TIME_MASK;
			const placeholder = isToday ? TIME_PLACEHOLDER : DATE_TIME_PLACEHOLDER;

			setInputConfig({
				...inputConfig,
				value: updatedTimestamp.format(mask),
				mask,
				placeholder,
				timestamp,
				isValidDate: true,
			});
		}
	}, [timestamp]);

	React.useEffect(() => {
		if (windowRange) {
			const [from, to] = windowRange;
			const centerTimestamp = from + (to - from) / 2;

			setInputConfig({
				isValidDate: true,
				mask: DATE_TIME_MASK,
				placeholder: DATE_TIME_PLACEHOLDER,
				timestamp: centerTimestamp,
				value: moment.utc(centerTimestamp).format(DATE_TIME_MASK),
			});
		}
	}, [windowRange]);

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
				value: pointerTimestamp
					? moment.utc(pointerTimestamp).format(mask)
					: timestamp
					? moment.utc(timestamp).format(mask)
					: '',
				mask,
				placeholder,
				timestamp,
				isValidDate: true,
			});
		}
		previousPointerTimestamp.current = pointerTimestamp;
	}, [pointerTimestamp]);

	const restoreTimestampTimer = React.useRef<NodeJS.Timeout | null>();

	const prevHoveredTimestamp = usePrevious(hoveredTimestamp);

	React.useEffect(() => {
		if (hoveredTimestamp && restoreTimestampTimer.current) {
			clearTimeout(restoreTimestampTimer.current);
			restoreTimestampTimer.current = null;
		}

		if (prevHoveredTimestamp === null && hoveredTimestamp !== null) {
			savedInputConfig.current = inputConfig;
		}

		if (hoveredTimestamp) {
			const mask = inputConfig.mask || DateTimeMask.DATE_TIME_MASK;
			setInputConfig({
				...inputConfig,
				value: moment.utc(hoveredTimestamp).format(mask),
				mask,
				placeholder: inputConfig.placeholder || DATE_TIME_PLACEHOLDER,
				timestamp: hoveredTimestamp,
				isValidDate: true,
			});
		}

		if (!hoveredTimestamp && prevHoveredTimestamp) {
			restoreTimestampTimer.current = setTimeout(() => {
				if (savedInputConfig.current) {
					setInputConfig({
						...savedInputConfig.current,
					});
					if (savedInputConfig.current.timestamp) {
						submitTimestamp(savedInputConfig.current.timestamp);
					}
				}
			}, 800);
		}
	}, [hoveredTimestamp]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		const { mask, value, placeholder } = inputConfig;

		if (e.keyCode === KeyCodes.TAB && mode === 'timestamp') {
			e.preventDefault();
			if (mask && isCompletable(value, mask) && placeholder) {
				const fullDate = replaceBlankTimeCharsWithDefaults(value, mask, placeholder);
				const completedTimestamp = moment.utc(fullDate, mask);
				if (fullDate !== null && completedTimestamp.isValid()) {
					setInputConfig({
						...inputConfig,
						value: fullDate,
						isValidDate: true,
						timestamp: completedTimestamp.valueOf(),
					});
					setTimestamp(completedTimestamp.valueOf());
				}
			}
		}
	}

	function handleInputValueChange(event: React.ChangeEvent<HTMLInputElement>) {
		const value = event.target.value;

		if (!value) {
			setMode('history');
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
				isValidDate: value.length === TIME_MASK.length && moment.utc(value, TIME_MASK).isValid(),
				mask: TIME_MASK,
				placeholder: TIME_PLACEHOLDER,
				timestamp: parsedTime.valueOf(),
				value,
			});
			setTimestamp(parsedTime.valueOf());
			setMode('timestamp');
		} else if (value.length > 2 && isCompletable(value, DATE_TIME_MASK) && parsedDate.isValid()) {
			setInputConfig({
				isValidDate:
					value.length === DATE_TIME_MASK.length && moment.utc(value, DATE_TIME_MASK).isValid(),
				mask: DATE_TIME_MASK,
				placeholder: DATE_TIME_PLACEHOLDER,
				timestamp: parsedDate.valueOf(),
				value,
			});
			setTimestamp(parsedDate.valueOf());
			setMode('timestamp');
		} else {
			setInputConfig({
				isValidDate: false,
				mask: null,
				placeholder: null,
				timestamp: null,
				value,
			});
			setTimestamp(null);
			setMode('history');
		}
	}

	function onInputFocus() {
		if (
			inputConfig.value.length &&
			(isCompletable(inputConfig.value, DATE_TIME_MASK) ||
				isCompletable(inputConfig.value, TIME_MASK))
		) {
			setMode('timestamp');
		} else {
			setMode('history');
		}
	}

	function preventDefaultHandlers(handlers: KeyboardHandler) {
		const newHandlers: KeyboardHandler = {};
		for (const [action, handler] of Object.entries(handlers)) {
			newHandlers[action] = (event) => {
				if (event) {
					event.preventDefault();
				}
				handler();
			};
		}
		return newHandlers;
	}

	const refInput = useRef<HTMLInputElement | null>(null);

	function hotkeyFocusHandler() {
		refInput.current?.focus();
	}

	const keyMap = {
		INPUT_FOCUS: 'Shift+T',
	};

	const handlers = preventDefaultHandlers({
		INPUT_FOCUS: hotkeyFocusHandler,
	});

	return (
		<div className='graph-search-input'>
			<GlobalHotKeys keyMap={keyMap} handlers={handlers} />
			<input
				value={inputConfig.value}
				onChange={handleInputValueChange}
				className='graph-search-input__input'
				onFocus={onInputFocus}
				onKeyDown={handleKeyDown}
				type='text'
				ref={refInput}
			/>
			{mode === 'timestamp' && (
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
			)}
		</div>
	);
}

export default React.memo(GraphSearchInput);
