/** ****************************************************************************
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

import React from 'react';
import useSetState from '../../hooks/useSetState';
import {
	FilterRowMultipleStringsConfig,
	FilterRowStringConfig,
	FilterRowTogglerConfig,
	FilterRowSwitcherConfig,
} from '../../models/filter/FilterInputs';
import { SSEFilterInfo, SSEFilterParameter } from '../../api/sse';
import FilterRow from '../filter/row';
import { SearchPanelType } from './SearchPanel';
import { getArrayOfUniques } from '../../helpers/array';
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import { notEmpty } from '../../helpers/object';
import { prettifyCamelcase } from '../../helpers/stringUtils';

export type StringFilter = {
	type: 'string';
	values: string;
	negative: boolean;
	hint: string;
};

export type MultipleStringFilter = {
	type: 'string[]';
	values: string[];
	negative: boolean;
	conjunct: boolean;
	hint: string;
};

export type SwitcherFilter = {
	type: 'switcher';
	values: string;
};

export type Filter = StringFilter | MultipleStringFilter | SwitcherFilter;

export type EventFilterState = {
	attachedMessageId: StringFilter;
	type: MultipleStringFilter;
	body: MultipleStringFilter;
	name: MultipleStringFilter;
	status: SwitcherFilter;
	text: MultipleStringFilter;
	parentId: MultipleStringFilter;
};

export type MessageFilterState = {
	attachedEventIds: MultipleStringFilter;
	type: MultipleStringFilter;
	body: MultipleStringFilter;
	bodyBinary: MultipleStringFilter;
	text: MultipleStringFilter;
};

export type FilterState = EventFilterState | MessageFilterState;

type FilterRowConfig =
	| FilterRowSwitcherConfig
	| FilterRowTogglerConfig
	| FilterRowStringConfig
	| FilterRowMultipleStringsConfig;

interface SearchPanelFiltersProps {
	type: SearchPanelType;
	info: SSEFilterInfo[];
	state: FilterState;
	setState: (patch: Partial<FilterState>) => void;
	disableAll: boolean;
	autocompletes: (FiltersHistoryType<EventFilterState> | FiltersHistoryType<MessageFilterState>)[];
}

type Values = {
	[key: string]: string;
};

const SearchPanelFilters = (props: SearchPanelFiltersProps) => {
	const { info, state, setState, disableAll, autocompletes } = props;

	function getValuesUpdater<T extends keyof FilterState>(name: T) {
		return function valuesUpdater<K extends FilterState[T]>(values: K) {
			setState({ [name]: { ...state[name], values } });
		};
	}

	function getToggler<T extends keyof FilterState>(
		filterName: T,
		paramName: keyof MultipleStringFilter,
	) {
		return function toggler() {
			setState({
				[filterName]: { ...state[filterName], [paramName]: !state[filterName][paramName] },
			});
		};
	}

	function getState<T extends keyof FilterState>(name: T) {
		return state[name];
	}

	const [currentValues, setCurrentValues] = useSetState<Values>({});

	React.useEffect(() => {
		const newStateKeys: Values = {};
		let hasUpdate = false;
		Object.keys(state).forEach(stateKey => {
			if (!currentValues[stateKey] === undefined) {
				newStateKeys[stateKey] = '';
				hasUpdate = true;
			}
		});

		if (hasUpdate) {
			setCurrentValues({
				...currentValues,
				...newStateKeys,
			});
		}
	}, [state, currentValues]);

	const setCurrentValue = (name: string) => (value: string) => {
		setCurrentValues({ [name]: value });
	};

	return (
		<>
			{info.map((filter: SSEFilterInfo) => {
				const filterState = getState(filter.name);
				const label = prettifyCamelcase(filter.name);
				const autocompleteList = getArrayOfUniques(
					autocompletes
						.map(item => item.filters[filter.name as keyof FilterState]?.values)
						.filter(notEmpty)
						.flat(),
				);

				const config = filterState
					? filter.parameters.map((param: SSEFilterParameter): FilterRowConfig => {
							switch (param.type.value) {
								case 'boolean':
									return {
										id: `${filter.name}-${param.name}`,
										label: '',
										disabled: disableAll,
										type: 'toggler',
										value: filterState[param.name],
										toggleValue: getToggler(filter.name, param.name as keyof Filter),
										possibleValues: param.name === 'negative' ? ['excl', 'incl'] : ['and', 'or'],
									};
								case 'string':
									return {
										id: filter.name,
										disabled: disableAll,
										label: '',
										type: 'string',
										value: filterState.values || '',
										setValue: getValuesUpdater(filter.name),
										autocompleteList,
										hint: filter.hint,
									};
								case 'switcher':
									return {
										id: filter.name,
										disabled: disableAll,
										label: '',
										type: 'switcher',
										value: filterState.values,
										setValue: getValuesUpdater(filter.name),
										possibleValues: ['passed', 'failed', 'any'],
										defaultValue: 'any',
									};
								default:
									return {
										id: filter.name,
										disabled: disableAll,
										label: '',
										type: 'multiple-strings',
										values: filterState.values,
										setValues: getValuesUpdater(filter.name),
										currentValue: currentValues[filter.name] || '',
										setCurrentValue: setCurrentValue(filter.name),
										autocompleteList,
										hint: filter.hint,
									};
							}
					  })
					: [];

				return (
					<div className='filter-row' key={filter.name}>
						<p className='filter-row__label'>{label}</p>
						{config.map(rowConfig => (
							<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
						))}
					</div>
				);
			})}
		</>
	);
};

export default SearchPanelFilters;
