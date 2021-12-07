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

export type FitlerRowItem =
	| FilterRowDatetimeRangeConfig
	| FilterRowTimeWindowConfig
	| FilterRowStringConfig
	| FilterRowMultipleStringsConfig
	| FilterRowTogglerConfig
	| FilterRowSwitcherConfig
	| FilterRowEventResolverConfig;

export type CompoundFilterRow = Array<FitlerRowItem>;

export type ActionFilterRow = ActionFilterConfig;

export type FilterRowConfig = FitlerRowItem | CompoundFilterRow | ActionFilterRow;

export enum DateTimeMask {
	TIME_MASK = 'HH:mm:ss.SSS',
	DATE_MASK = 'YYYY-MM-DD',
	DATE_TIME_MASK = 'DD.MM.YYYY HH:mm:ss.SSS',
	INTERVAL_MASK = 'mm',
}

export type TimeShortcut = {
	from: number;
	to: number;
};

export type DateTimeInputType = {
	label?: string;
	value: number | null;
	setValue: (nextValue: number | null) => void;
	type: TimeInputType;
	id: string;
	inputMask: (string | RegExp)[];
	dateMask: DateTimeMask;
	placeholder: string;
	inputClassName?: string;
	labelClassName?: string;
	disabled?: boolean;
};

export type IntervalInputType = {
	label?: string;
	value: number | null;
	setValue: (nextValue: number) => void;
	type: TimeInputType;
	id: string;
	inputMask: RegExp;
	placeholder: string;
	inputClassName?: string;
	labelClassName?: string;
};

export enum TimeInputType {
	DATE_TIME,
	DATE,
	TIME,
	INTERVAL,
}

export type FilterRowBaseConfig = {
	id: string;
	label?: string;
	disabled?: boolean;
	wrapperClassName?: string;
	placeholder?: string;
	isInvalid?: boolean;
	required?: boolean;
};

export type FilterRowTimeWindowConfig = FilterRowBaseConfig & {
	type: 'time-window';
	inputs: Array<DateTimeInputType | IntervalInputType>;
};

export type FilterRowStringConfig = FilterRowBaseConfig & {
	className?: string;
	type: 'string';
	value: string;
	setValue: (nextValue: string) => void;
	labelClassName?: string;
	autocompleteList?: string[];
	hint?: string;
};

export type FilterRowMultipleStringsConfig = FilterRowBaseConfig & {
	type: 'multiple-strings';
	values: string[];
	setValues: (nextValues: string[]) => void;
	currentValue: string;
	setCurrentValue: (currentValue: string) => void;
	autocompleteList?: string[];
	validateBubbles?: boolean;
	hint?: string;
	labelClassName?: string;
	onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
	onBlur?: () => void;
};

export type FilterRowDatetimeRangeConfig = FilterRowBaseConfig & {
	type: 'datetime-range';
	inputs: Array<DateTimeInputType>;
	timeShortcuts: Array<{
		label: string;
		onClick: () => void;
	}>;
};

export type FilterRowTogglerConfig = FilterRowBaseConfig & {
	type: 'toggler';
	disabled?: boolean;
	value: boolean;
	possibleValues: [string, string];
	toggleValue: () => void;
	labelClassName?: string;
	className?: string;
};

export type FilterRowSwitcherConfig = FilterRowBaseConfig & {
	type: 'switcher';
	disabled?: boolean;
	value: string;
	setValue: (nextValue: string) => void;
	possibleValues: [string, string, string];
	className?: string;
	labelClassName?: string;
	defaultValue: string;
};

export type FilterRowEventResolverConfig = FilterRowBaseConfig & {
	type: 'event-resolver';
	value: string;
	setValue: (nextValue: string) => void;
	autocompleteList?: string[];
	onAutocompleteSelect?: () => void;
	labelClassName?: string;
	hint?: string;
};

export type ActionFilterConfig = {
	id: string;
	type: 'action';
	message: string;
	actionButtonText: string;
	action: () => void;
	isLoading?: boolean;
};
