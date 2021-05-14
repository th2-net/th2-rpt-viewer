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

import React from 'react';
import { observer } from 'mobx-react-lite';
import FilterPanel from './FilterPanel';
import { FilterRowConfig, FilterRowTogglerConfig } from '../../models/filter/FilterInputs';
import { useWorkspaceEventStore, useEventsFilterStore, useFiltersHistoryStore } from '../../hooks';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { EventSSEFilters } from '../../api/sse';
import { Filter, EventFilterState } from '../search-panel/SearchPanelFilters';
import { getObjectKeys, notEmpty } from '../../helpers/object';
import EventsFilter from '../../models/filter/EventsFilter';
import FiltersHistory from '../filters-history/FiltersHistory';
import { getArrayOfUniques } from '../../helpers/array';
import useSetState from '../../hooks/useSetState';

type CurrentFilterValues = {
	[key in EventSSEFilters]: string;
};

function getDefaultCurrentFilterValues(filter: EventsFilter | null) {
	return filter
		? getObjectKeys(filter).reduce(
				(values, filterName) => ({
					...values,
					[filterName]: '',
				}),
				{} as CurrentFilterValues,
		  )
		: null;
}

function EventsFilterPanel() {
	const eventsStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const filterStore = useEventsFilterStore();
	const { history } = useFiltersHistoryStore();

	const [filter, setFilter] = useSetState<EventFilterState | null>(filterStore.filter);
	const [showFilter, setShowFilter] = React.useState(false);

	const [currentFilterValues, setCurrentFilterValues] = React.useState<CurrentFilterValues | null>(
		getDefaultCurrentFilterValues(filterStore.filter),
	);

	const autocompletes = history[0];

	React.useEffect(() => {
		setFilter(filterStore.filter);
		setCurrentFilterValues(getDefaultCurrentFilterValues(filterStore.filter));
	}, [filterStore.filter]);

	const onSubmit = React.useCallback(() => {
		if (filter) {
			eventsStore.applyFilter(filter);
		}
	}, [filter]);

	const getNegativeToggler = React.useCallback(
		(filterName: EventSSEFilters) => {
			return function negativeToggler() {
				if (filter) {
					const filterValue = filter[filterName];
					if (filterValue && 'negative' in filterValue) {
						const updatedFilterValue = {
							...filterValue,
							negative: !filterValue.negative,
						};
						setFilter({ [filterName]: updatedFilterValue });
					}
				}
			};
		},
		[filter],
	);

	const getValuesUpdater = React.useCallback(
		<T extends 'string' | 'string[]' | 'switcher'>(name: EventSSEFilters) => {
			return function valuesUpdater(values: T extends 'string[]' ? string[] : string) {
				if (filter) {
					setFilter({ [name]: { ...filter[name], values } });
				}
			};
		},
		[filter],
	);

	const setCurrentValue = React.useCallback(
		(filterName: EventSSEFilters) => {
			return function setValue(value: string) {
				if (currentFilterValues) {
					setCurrentFilterValues({
						...currentFilterValues,
						[filterName]: value,
					});
				}
			};
		},
		[currentFilterValues],
	);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(() => {
		if (!filter || !currentFilterValues) return [];

		const filterNames = getObjectKeys(filter);

		return filterNames.map(filterName => {
			const filterValues: Filter = filter[filterName];
			const label = (filterName.charAt(0).toUpperCase() + filterName.slice(1))
				.split(/(?=[A-Z])/)
				.join(' ');

			let toggler: FilterRowTogglerConfig | null = null;

			const name = filterName as keyof EventFilterState;
			const autocompleteList = getArrayOfUniques(
				autocompletes
					.filter(item => (item.filters as EventFilterState)[name])
					.map(item => (item.filters as EventFilterState)[name].values)
					.flat(),
			);

			if ('negative' in filterValues) {
				toggler = {
					id: `${filterName}-include`,
					label,
					type: 'toggler',
					value: filterValues.negative,
					toggleValue: getNegativeToggler(filterName),
					possibleValues: ['excl', 'incl'],
					className: 'filter-row__toggler',
					labelClassName: 'event-filters-panel-label',
				};
			}

			let filterInput: FilterRowConfig | null = null;
			switch (filterValues.type) {
				case 'string':
					filterInput = {
						id: filterName,
						type: 'string',
						value: filterValues.values,
						setValue: getValuesUpdater(filterName),
						autocompleteList,
					};
					break;
				case 'string[]':
					filterInput = {
						id: filterName,
						type: 'multiple-strings',
						values: filterValues.values,
						setValues: getValuesUpdater(filterName),
						currentValue: currentFilterValues[filterName] || '',
						setCurrentValue: setCurrentValue(filterName),
						autocompleteList,
					};
					break;
				case 'switcher':
					filterInput = {
						id: filterName,
						disabled: false,
						label,
						type: 'switcher',
						value: filterValues.values,
						setValue: getValuesUpdater(filterName),
						possibleValues: ['passed', 'failed', 'any'],
						defaultValue: 'any',
						labelClassName: 'event-filters-panel-label',
					};
					break;
				default:
					break;
			}

			const filterRow = [toggler, filterInput].filter(notEmpty);
			return filterRow.length === 1 ? filterRow[0] : filterRow;
		});
	}, [filter, currentFilterValues, setCurrentValue, getValuesUpdater, getNegativeToggler]);

	return (
		<FilterPanel
			isLoading={eventDataStore.isLoading}
			isFilterApplied={filterStore.isEventsFilterApplied}
			renderFooter={() =>
				filter && (
					<FiltersHistory
						type='event'
						sseFilter={{
							state: filter,
							setState: setFilter,
						}}
					/>
				)
			}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			onSubmit={onSubmit}
			onClearAll={eventsStore.clearFilter}
			config={filterConfig}
		/>
	);
}

export default observer(EventsFilterPanel);
