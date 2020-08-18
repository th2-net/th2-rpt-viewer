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

import React from 'react';
import { observer } from 'mobx-react-lite';
import FilterPanel, { FilterRowConfig } from './FilterPanel';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';

function EventsFilterPanel() {
	const eventWindowStore = useEventWindowStore();
	const { filterStore } = eventWindowStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [timestampFrom, setTimestampFrom] = React.useState(filterStore.eventsFilter.timestampFrom);
	const [timestampTo, setTimestampTo] = React.useState(filterStore.eventsFilter.timestampTo);
	const [currentName, setCurrentName] = React.useState('');
	const [names, setNames] = React.useState(filterStore.eventsFilter.names);
	const [currentType, setCurrentEventType] = React.useState('');
	const [eventTypes, setEventsTypes] = React.useState(filterStore.eventsFilter.names);

	React.useEffect(() => {
		setTimestampFrom(filterStore.eventsFilter.timestampFrom);
		setTimestampTo(filterStore.eventsFilter.timestampTo);
		setNames(filterStore.eventsFilter.names);
		setEventsTypes(filterStore.eventsFilter.eventTypes);
	}, [filterStore.eventsFilter]);

	const onSubmit = () => {
		if (timestampFrom != null || timestampTo != null) {
			const nextTimestampFrom = timestampFrom ?? new Date().getTime();
			const nextTimestampTo = timestampTo ?? new Date().getTime();

			if (nextTimestampFrom > nextTimestampTo) {
				// eslint-disable-next-line no-alert
				window.alert('Invalid timestamp filter for events.');
				return;
			}

			eventWindowStore.fetchRootEvents({
				timestampFrom: nextTimestampFrom,
				timestampTo: nextTimestampTo,
				names,
				eventTypes,
			});
		} else {
			eventWindowStore.fetchRootEvents({
				timestampFrom: null,
				timestampTo: null,
				names,
				eventTypes,
			});
		}
	};

	const onClear = () => {
		eventWindowStore.fetchRootEvents();
	};

	const filterConfig: FilterRowConfig[] = [{
		type: 'datetime-range',
		id: 'events-datetime',
		label: 'Events from',
		fromValue: timestampFrom,
		toValue: timestampTo,
		setFromValue: setTimestampFrom,
		setToValue: setTimestampTo,
	}, {
		type: 'multiple-strings',
		id: 'events-name',
		label: 'Events name',
		values: names,
		setValues: setNames,
		currentValue: currentName,
		setCurrentValue: setCurrentName,
		autocompleteList: null,
	}, {
		type: 'multiple-strings',
		id: 'events-type',
		label: 'Events type',
		values: eventTypes,
		setValues: setEventsTypes,
		currentValue: currentType,
		setCurrentValue: setCurrentEventType,
		autocompleteList: null,
	}];

	return (
		<FilterPanel
			isLoading={eventWindowStore.isLoadingRootEvents}
			isFilterApplied={filterStore.isEventsFilterApplied}
			count={filterStore.isEventsFilterApplied ? eventWindowStore.eventsIds.length : null}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			onSubmit={onSubmit}
			onClearAll={onClear}
			config={filterConfig}/>
	);
}

export default observer(EventsFilterPanel);
