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
import { DateTimeMask, FilterRowConfig, TimeInputType } from '../../models/filter/FilterInputs';
import {
	DATE_TIME_INPUT_MASK,
	DATE_TIME_PLACEHOLDER,
	INTERVAL_MASK,
	INTERVAL_PLACEHOLDER,
} from '../../util/filterInputs';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { getTimeWindow } from '../../helpers/date';

function EventsFilterPanel() {
	const eventWindowStore = useEventWindowStore();
	const { filterStore } = eventWindowStore;

	const [timestamp, setTimestamp] = React.useState(filterStore.dirtyEventsFilter.timestamp);
	const [timeInterval, setTimeInterval] = React.useState(
		filterStore.dirtyEventsFilter.timeInterval,
	);
	const [showFilter, setShowFilter] = React.useState(false);
	const [currentName, setCurrentName] = React.useState('');
	const [names, setNames] = React.useState(filterStore.dirtyEventsFilter.names);
	const [currentType, setCurrentEventType] = React.useState('');
	const [eventTypes, setEventsTypes] = React.useState(filterStore.dirtyEventsFilter.names);

	React.useEffect(() => {
		if (filterStore.isEventsFilterApplied) {
			setTimestamp(filterStore.eventsFilter.timestamp);
			setTimeInterval(filterStore.eventsFilter.timeInterval);
			setNames(filterStore.eventsFilter.names);
			setEventsTypes(filterStore.eventsFilter.eventTypes);
		}
	}, [filterStore.eventsFilter]);

	React.useEffect(() => {
		const { timestampFrom, timestampTo } = getTimeWindow(timestamp, timeInterval, true);

		filterStore.setDirtyEventsFilter({
			timestamp,
			timeInterval,
			timestampFrom,
			timestampTo,
			names,
			eventTypes,
		});
	}, [timestamp, timeInterval, names, eventTypes]);

	const onSubmit = () => {
		filterStore.eventsTimeFilterIsApplied = true;

		const { timestampFrom, timestampTo } = getTimeWindow(timestamp, timeInterval, true);

		filterStore.setEventsFilter({
			timestamp,
			timeInterval,
			timestampFrom,
			timestampTo,
			names,
			eventTypes,
		});
	};

	const onClear = () => {
		filterStore.resetEventsFilter();
	};

	const filterConfig: FilterRowConfig[] = [
		{
			type: 'time-window',
			id: 'events-time-window',
			label: 'Events timestamp',
			inputs: [
				{
					label: 'Timestamp',
					value: timestamp,
					setValue: value => setTimestamp(value),
					type: TimeInputType.DATE_TIME,
					id: 'events-timestamp',
					inputMask: DATE_TIME_INPUT_MASK,
					dateMask: DateTimeMask.DATE_TIME_MASK,
					placeholder: DATE_TIME_PLACEHOLDER,
					labelClassName: 'filter-row__label',
				},
				{
					label: 'Time interval',
					value: timeInterval,
					setValue: setTimeInterval,
					type: TimeInputType.INTERVAL,
					id: 'events-interval',
					inputMask: INTERVAL_MASK,
					placeholder: INTERVAL_PLACEHOLDER,
					inputClassName: 'time-interval',
					labelClassName: 'filter-row__label',
				},
			],
		},
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
