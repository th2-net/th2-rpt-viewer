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
import { FilterRowConfig } from '../../models/filter/FilterInputs';
import { useWorkspaceEventStore, useGraphDataStore } from '../../hooks';

function EventsFilterPanel() {
	const eventWindowStore = useWorkspaceEventStore();
	const graphDataStore = useGraphDataStore();
	const { filterStore } = eventWindowStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [currentName, setCurrentName] = React.useState('');
	const [names, setNames] = React.useState(filterStore.eventsFilter.names);
	const [currentType, setCurrentEventType] = React.useState('');
	const [eventTypes, setEventsTypes] = React.useState(filterStore.eventsFilter.names);

	React.useEffect(() => {
		setNames(filterStore.eventsFilter.names);
		setEventsTypes(filterStore.eventsFilter.eventTypes);
	}, [filterStore.eventsFilter]);

	const onSubmit = () => {
		eventWindowStore.filterStore.setEventsFilter({
			names,
			eventTypes,
			timestampFrom: graphDataStore.range[0],
			timestampTo: graphDataStore.range[1],
		});
	};

	const onClear = () => {
		eventWindowStore.filterStore.resetEventsFilter();
	};

	const filterConfig: FilterRowConfig[] = [
		{
			type: 'multiple-strings',
			id: 'events-name',
			label: 'Events name',
			values: names,
			setValues: setNames,
			currentValue: currentName,
			setCurrentValue: setCurrentName,
			autocompleteList: null,
		},
		{
			type: 'multiple-strings',
			id: 'events-type',
			label: 'Events type',
			values: eventTypes,
			setValues: setEventsTypes,
			currentValue: currentType,
			setCurrentValue: setCurrentEventType,
			autocompleteList: null,
		},
	];

	return (
		<FilterPanel
			isLoading={eventWindowStore.isLoadingRootEvents}
			isFilterApplied={filterStore.isEventsFilterApplied}
			count={filterStore.isEventsFilterApplied ? eventWindowStore.eventTree.length : null}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			onSubmit={onSubmit}
			onClearAll={onClear}
			config={filterConfig}
		/>
	);
}

export default observer(EventsFilterPanel);
