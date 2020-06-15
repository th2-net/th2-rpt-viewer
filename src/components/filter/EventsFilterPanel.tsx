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
import { useFirstEventWindowStore } from '../../hooks/useFirstEventWindowStore';

function EventsFilterPanel() {
	const { filterStore } = useFirstEventWindowStore();

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
		filterStore.setEventsFilter({
			timestampFrom,
			timestampTo,
			name,
			eventType,
		});
	};

	const onClear = () => {
		filterStore.resetEventsFilter();
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
		id: 'events-name',
		label: 'Events name',
		value: name ?? '',
		setValue: next => (next === '' ? setName(null) : setName(next)),
	}, {
		type: 'string',
		id: 'events-type',
		label: 'Events type',
		value: eventType ?? '',
		setValue: next => (next === '' ? setEventType(null) : setEventType(next)),
	}];

	return (
		<FilterPanel
			isFilterApplied={false}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			onSubmit={onSubmit}
			onClearAll={onClear}
			config={filterConfig}
			isDisabled={false}/>
	);
}

export default observer(EventsFilterPanel);
