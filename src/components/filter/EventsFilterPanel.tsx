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
	const [name, setName] = React.useState(filterStore.eventsFilter.name);
	const [eventType, setEventType] = React.useState(filterStore.eventsFilter.eventType);

	React.useEffect(() => {
		setTimestampFrom(filterStore.eventsFilter.timestampFrom);
		setTimestampTo(filterStore.eventsFilter.timestampTo);
		setName(filterStore.eventsFilter.name);
		setEventType(filterStore.eventsFilter.eventType);
	}, [showFilter, filterStore.eventsFilter]);

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
				name,
				eventType,
			});
		} else {
			eventWindowStore.fetchRootEvents({
				timestampFrom: null,
				timestampTo: null,
				name,
				eventType,
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
		type: 'string',
		id: 'event-name',
		label: 'Event name',
		value: name ?? '',
		setValue: next => setName(next === '' ? null : next),
	}, {
		type: 'string',
		id: 'events-type',
		label: 'Events type',
		value: eventType ?? '',
		setValue: next => setEventType(next === '' ? null : next),
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
