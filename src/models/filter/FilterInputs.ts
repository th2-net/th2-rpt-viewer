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
 * limitations under the License.
 ***************************************************************************** */

export type FilterRowConfig = FilterRowDatetimeRangeConfig | FilterRowStringConfig | FilterRowMultipleStringsConfig;

export enum DateTimeMask {
	TIME_MASK = 'HH:mm:ss.SSS',
	DATE_MASK = 'YYYY-MM-DD',
	DATE_TIME_MASK = 'YYYY-MM-DD HH:mm:ss.SSS',
}

export type TimeShortcut = {
	from: number;
	to: number;
};

export type DateTimeInputType = {
	label?: string;
	value: number | null;
	setValue: (nextValue: number) => void;
	type: TimeInputType;
	id: string;
	inputMask: (string | RegExp)[];
	dateMask: DateTimeMask;
	placeholder: string;
	inputClassName?: string;
	labelClassName?: string;
};

export enum TimeInputType {
	DATE_TIME,
	DATE,
	TIME
}

export type FilterRowBaseConfig = {
	id: string;
	label: string;
};

export type FilterRowDatetimeRangeConfig = FilterRowBaseConfig & {
	type: 'datetime-range';
	inputs: Array<DateTimeInputType>;
	timeShortcuts: Array<{
		label: string;
		onClick: () => void;
	}>;
};

export type FilterRowStringConfig = FilterRowBaseConfig & {
	type: 'string';
	value: string;
	setValue: (nextValue: string) => void;
};

export type FilterRowMultipleStringsConfig = FilterRowBaseConfig & {
	type: 'multiple-strings';
	values: string[];
	setValues: (nextValues: string[]) => void;
	currentValue: string;
	setCurrentValue: (currentValue: string) => void;
	autocompleteList: string[] | null;
};
