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

export type StringFilter = {
	type: 'string';
	values: string;
	negative: boolean;
};

export type MultipleStringFilter = {
	type: 'string[]';
	values: string[];
	negative: boolean;
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
};

export type MessageFilterState = {
	attachedEventIds: {
		negative: boolean;
		values: string[];
	};
	type: {
		negative: boolean;
		values: string[];
	};
	body: {
		negative: boolean;
		values: string[];
	};
};

export type FilterState = EventFilterState | MessageFilterState;

type FilterRowConfig =
	| FilterRowSwitcherConfig
	| FilterRowTogglerConfig
	| FilterRowStringConfig
	| FilterRowMultipleStringsConfig;

interface SearchPanelFiltersProps {
	info: SSEFilterInfo[];
	state: FilterState;
	setState: (patch: Partial<FilterState>) => void;
	disableAll: boolean;
}

type Values = {
	[key: string]: string;
};

const SearchPanelFilters = (props: SearchPanelFiltersProps) => {
	const { info, state, setState, disableAll } = props;

	function getValuesUpdater<T extends keyof FilterState>(name: T) {
		return function valuesUpdater<K extends FilterState[T]>(values: K) {
			setState({ [name]: { ...state[name], values } });
		};
	}

	function getNegativeToggler<T extends keyof FilterState>(name: T) {
		return function negativeToggler() {
			setState({ [name]: { ...state[name], negative: !state[name].negative } });
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
				const label = (filter.name.charAt(0).toUpperCase() + filter.name.slice(1))
					.split(/(?=[A-Z])/)
					.join(' ');

				const config = filter.parameters.map(
					(param: SSEFilterParameter): FilterRowConfig => {
						switch (param.type.value) {
							case 'boolean':
								return {
									id: `${filter.name}-include`,
									label: '',
									disabled: disableAll,
									type: 'toggler',
									value: getState(filter.name).negative,
									toggleValue: getNegativeToggler(filter.name),
									possibleValues: ['excl', 'incl'],
								};
							case 'string':
								return {
									id: filter.name,
									disabled: disableAll,
									label: '',
									type: 'string',
									value: getState(filter.name).values || '',
									setValue: getValuesUpdater(filter.name),
								};
							case 'switcher':
								return {
									id: filter.name,
									disabled: disableAll,
									label: '',
									type: 'switcher',
									value: getState(filter.name).values,
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
									values: getState(filter.name).values,
									setValues: getValuesUpdater(filter.name),
									currentValue: currentValues[filter.name] || '',
									setCurrentValue: setCurrentValue(filter.name),
									autocompleteList: null,
								};
						}
					},
				);

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
