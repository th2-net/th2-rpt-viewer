/** ****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

import { useMemo, useState, useCallback, useEffect } from 'react';
import { SSEFilterParameter, SSEFilterInfo, FilterKeys } from '../api/sse';
import { prettifyCamelcase } from '../helpers/stringUtils';
import { FilterRowConfig, FitlerRowItem } from '../models/filter/FilterInputs';
import { notEmpty, getObjectKeys } from '../helpers/object';
import { StringFilter, MultipleStringFilter, SwitcherFilter } from '../models/filter/Filter';

export type FilterClassnames = Partial<
	Record<
		SSEFilterParameter['type']['value'],
		{
			className?: string;
			labelClassName?: string;
		}
	>
>;

export type ConfigAutocompleteLists = Partial<Record<FilterKeys, string[]>>;

type FilterConfig = StringFilter | MultipleStringFilter | SwitcherFilter;

type Filter = Partial<Record<FilterKeys, FilterConfig>>;

type CurrentValues = Partial<Record<FilterKeys, string>>;

const togglerValues: Record<'conjunct' | 'negative' | 'strict', [string, string]> = {
	conjunct: ['And', 'Or'],
	negative: ['Exclude', 'Include'],
	strict: ['Strict-On', 'Strict-Off'],
};

const statusValues = ['All', 'Passed', 'Failed'];

interface UseFilterConfigProps<T extends Filter> {
	filterInfo: SSEFilterInfo[];
	disabled?: boolean;
	order?: FilterKeys[];
	filter: T | null;
	classNames?: FilterClassnames;
	autocompleteLists?: ConfigAutocompleteLists;
}

const getCurrentValues = (filter: Filter | null) => {
	if (!filter) return {};
	return getObjectKeys(filter).reduce(
		(values, filterName) => ({
			...values,
			[filterName]: '',
		}),
		{} as CurrentValues,
	);
};

export function useFilterConfig<T extends Filter>({
	filterInfo,
	disabled = false,
	filter,
	classNames = {},
	order = [],
	autocompleteLists = {},
}: UseFilterConfigProps<T>) {
	const [filterState, setFilterState] = useState<T | null>(filter);
	const [currentValues, setCurrentValues] = useState<CurrentValues>(() =>
		getCurrentValues(filterState),
	);

	const setFilter = useCallback((state: T | null) => {
		setFilterState(state);
		setCurrentValues(getCurrentValues(state || {}));
	}, []);

	useEffect(() => {
		setFilter(filter);
	}, [filter]);

	const getValuesUpdater = useCallback(
		(filterName: FilterKeys) => {
			return function updateFilter(values: string | string[]) {
				setFilterState(currentState => {
					const state = currentState && currentState[filterName];
					if (!state) return currentState;
					return {
						...currentState,
						[filterName]: {
							...state,
							values,
						},
					} as T;
				});
			};
		},
		[setFilterState],
	);

	const setCurrentValue = useCallback(
		(filterName: string) => {
			return function updateCurrentValue(value: string) {
				setCurrentValues(values => ({
					...values,
					[filterName]: value,
				}));
			};
		},
		[setCurrentValues],
	);

	const getToggler = useCallback(
		(filterName: FilterKeys, paramName: SSEFilterParameter['name']) => {
			return function updateFilter() {
				setFilterState(currentState => {
					const state = currentState && currentState[filterName];
					if (!state) return currentState;
					return {
						...currentState,
						[filterName]: {
							...state,
							[paramName]: !state[paramName as keyof FilterConfig],
						},
					} as T;
				});
			};
		},
		[setFilterState],
	);

	const config: FilterRowConfig[] = useMemo(() => {
		if (!filterState) return [];
		return filterInfo
			.slice()
			.sort((filterA, filterB) => {
				return order.indexOf(filterA.name) - order.indexOf(filterB.name);
			})
			.map(({ name, hint, parameters }, filterIndex) => {
				const state = filterState[name];

				if (!state) return null;

				const label = prettifyCamelcase(name);

				const filterConfig = parameters.map<FitlerRowItem | null>((filterParam, paramIndex) => {
					const common = {
						id: `${filterParam.name}-${filterIndex}`,
						disabled,
						className: classNames[filterParam.type.value]?.className,
						labelClassName: classNames[filterParam.type.value]?.labelClassName,
						label: paramIndex === 0 ? label : undefined,
					};

					switch (filterParam.type.value) {
						case 'string':
							return {
								type: 'string',
								label,
								value: state.values as string,
								setValue: getValuesUpdater(name),
								autocompleteList: autocompleteLists[name],
								hint,
								...common,
							};
						case 'string[]':
							return {
								label,
								type: 'multiple-strings',
								values: state.values as string[],
								setValues: getValuesUpdater(name),
								currentValue: currentValues[name] || '',
								setCurrentValue: setCurrentValue(name),
								autocompleteList: autocompleteLists[name],
								hint,
								...common,
							};
						case 'boolean':
							return {
								...common,
								type: 'toggler',
								value: (state as MultipleStringFilter)[filterParam.name] as boolean,
								toggleValue: getToggler(name, filterParam.name),
								possibleValues:
									togglerValues[filterParam.name as 'conjunct' | 'negative' | 'strict'],
							};
						case 'switcher':
							return {
								...common,
								type: 'switcher',
								value: state.values as string,
								setValue: getValuesUpdater(name),
								possibleValues: statusValues,
								defaultValue: 'any',
							};
						default:
							return null;
					}
				});
				return filterConfig.filter(notEmpty);
			})
			.filter(notEmpty);
	}, [
		filterState,
		filterInfo,
		getToggler,
		currentValues,
		setCurrentValue,
		autocompleteLists,
		getValuesUpdater,
		filterState,
	]);

	return useMemo(
		() => ({
			config,
			setFilter,
			filter: filterState,
		}),
		[config, setFilter, filterState],
	);
}
