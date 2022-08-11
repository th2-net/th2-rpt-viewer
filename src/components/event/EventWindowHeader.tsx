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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import {
	useActivePanel,
	useWorkspaceEventStore,
	useWorkspaceStore,
	useEventsFilterStore,
	useFiltersHistoryStore,
} from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';
import EventsSearchPanel from './search/EventsSearchPanel';
import { EventListNavUp, EventListNavDown } from './EventListNavigation';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { isEventsStore } from '../../helpers/stores';
import { EventsIntervalInput } from './EventsIntervalInput';
import FilterConfig from '../filter/FilterConfig';
import { FilterRowConfig, FilterRowTogglerConfig } from '../../models/filter/FilterInputs';
import { Filter, EventFilterState } from '../search-panel/SearchPanelFilters';
import { prettifyCamelcase } from '../../helpers/stringUtils';
import { getArrayOfUniques } from '../../helpers/array';
import { getObjectKeys, notEmpty } from '../../helpers/object';
import useSetState from '../../hooks/useSetState';
import EventsFilter from '../../models/filter/EventsFilter';
import { EventSSEFilters } from '../../api/sse';
import FiltersHistory from '../filters-history/FiltersHistory';
import FilterButton from '../filter/FilterButton';

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

const priority = ['attachedMessageId', 'type', 'body', 'name', 'status', 'text'];

function EventWindowHeader() {
	const eventStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();
	const filterStore = useEventsFilterStore();

	const { eventsHistory } = useFiltersHistoryStore();
	const { activePanel } = useActivePanel();

	const [filter, setFilter] = useSetState<EventFilterState | null>(filterStore.filter);

	const [currentFilterValues, setCurrentFilterValues] = React.useState<CurrentFilterValues | null>(
		getDefaultCurrentFilterValues(filterStore.filter),
	);

	React.useEffect(() => {
		setFilter(filterStore.filter);
		setCurrentFilterValues(getDefaultCurrentFilterValues(filterStore.filter));
	}, [filterStore.filter]);

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventStore.viewStore.flattenedListView ? 'active' : null,
	);

	const onSubmit = React.useCallback(() => {
		if (filter) {
			eventStore.applyFilter(filter);
		}
	}, [filter]);

	const getToggler = React.useCallback(
		(filterName: EventSSEFilters, paramName: keyof Filter) => {
			return function toggler() {
				if (filter) {
					const filterValue = filter[filterName];
					if (filterValue && paramName in filterValue) {
						const updatedFilterValue = {
							...filterValue,
							[paramName]: !filterValue[paramName],
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

		const filterNames = getObjectKeys(filter).sort((a, b) => {
			return priority.indexOf(a) - priority.indexOf(b);
		});

		return filterNames.map(filterName => {
			const filterValues: Filter = filter[filterName];
			const label = prettifyCamelcase(filterName);

			let togglerNegative: FilterRowTogglerConfig | null = null;
			let togglerConjunct: FilterRowTogglerConfig | null = null;

			const autocompleteList = getArrayOfUniques(
				eventsHistory
					.map(item => item.filters[filterName]?.values)
					.filter(notEmpty)
					.flat(),
			);

			if ('negative' in filterValues) {
				togglerNegative = {
					id: `${filterName}-include`,
					label,
					type: 'toggler',
					value: filterValues.negative,
					toggleValue: getToggler(filterName, 'negative' as keyof Filter),
					possibleValues: ['Exclude', 'Include'],
					className: 'filter-row__toggler',
					labelClassName: 'event-filters-panel-label',
				};
			}

			if ('conjunct' in filterValues) {
				togglerConjunct = {
					id: `${filterName}-conjunct`,
					label: '',
					type: 'toggler',
					value: filterValues.conjunct,
					toggleValue: getToggler(filterName, 'conjunct' as keyof Filter),
					possibleValues: ['And', 'Or'],
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
						hint: filterValues.hint,
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
						hint: filterValues.hint,
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

			const filterRow = [togglerNegative, togglerConjunct, filterInput].filter(notEmpty);
			return filterRow.length === 1 ? filterRow[0] : filterRow;
		});
	}, [filter, eventsHistory, currentFilterValues, setCurrentValue, getValuesUpdater, getToggler]);

	return (
		<div className='window__controls'>
			<div className='event-window-header'>
				<div className='event-window-header__group'>
					<EventsSearchPanel
						isDisabled={workspaceStore.isActive ? !isEventsStore(activePanel) : true}
					/>
					<FilterButton
						isLoading={eventDataStore.isLoading}
						isFilterApplied={filterStore.isEventsFilterApplied}
						showFilter={filterStore.isOpen}
						setShowFilter={filterStore.setIsOpen}
					/>
					<div
						role='button'
						onClick={eventStore.viewStore.toggleFlattenEventListView}
						className={flattenButtonClassName}>
						Flat view
					</div>
					<EventsIntervalInput />
				</div>
				{eventDataStore.isLoading && (
					<div className='event-window-header__loader'>
						Resolving events<span>.</span>
						<span>.</span>
						<span>.</span>
					</div>
				)}
				{!eventDataStore.isLoading && (
					<div className='event-window-header__nav'>
						<EventListNavUp />
						<EventListNavDown />
					</div>
				)}
			</div>
			<FilterConfig
				config={filterConfig}
				showFilter={filterStore.isOpen}
				setShowFilter={filterStore.setIsOpen}
				onSubmit={onSubmit}
				onClearAll={eventStore.clearFilter}
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
			/>
		</div>
	);
}

export default observer(EventWindowHeader);
