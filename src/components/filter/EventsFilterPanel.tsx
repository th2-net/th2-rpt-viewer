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
import moment from 'moment';
import FilterPanel from './FilterPanel';
import { DateTimeMask, FilterRowConfig, TimeInputType } from '../../models/filter/FilterInputs';
import {
	DATE_INPUT_MASK, DATE_PLACEHOLDER, TIME_INPUT_MASK, TIME_PLACEHOLDER,
} from '../../util/filterInputs';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { getTimeRange } from '../../helpers/date';

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
		if (timestampFrom > timestampTo) {
			// eslint-disable-next-line no-alert
			window.alert('Invalid timestamp filter for events.');
			return;
		}

		eventWindowStore.filterStore.eventsTimeFilterIsApplied = true;
		eventWindowStore.filterStore.setEventsFilter({
			timestampFrom,
			timestampTo,
			names,
			eventTypes,
		});
	};

	const getTimeShortcutHandler = (minutesOffset: number) => () => {
		const { from, to } = getTimeRange(minutesOffset);
		setTimestampFrom(from);
		setTimestampTo(to);
	};

	const setDate = (baseDateTimeStamp: number, timestamp: number) => {
		const date = moment(baseDateTimeStamp).utc();

		return moment(timestamp)
			.utc()
			.set('date', date.get('date'))
			.set('month', date.get('month'))
			.set('year', date.get('year'))
			.valueOf();
	};

	const setTime = (baseDateTimeStamp: number, timestamp: number) => {
		const date = moment(baseDateTimeStamp).utc();

		return moment(timestamp)
			.utc()
			.set('hours', date.get('hours'))
			.set('minutes', date.get('minutes'))
			.set('seconds', date.get('seconds'))
			.set('milliseconds', date.get('milliseconds'))
			.valueOf();
	};

	const setTimestampFromDate = (timestamp: number) => {
		if (timestampTo) {
			setTimestampTo(setDate(timestamp, timestampTo));
		}
		setTimestampFrom(setTime(timestampFrom, timestamp));
	};

	const setTimestampFromTime = (timestamp: number) => {
		if (timestampFrom) {
			// eslint-disable-next-line no-param-reassign
			timestamp = setDate(timestampFrom, timestamp);
		}
		setTimestampFrom(timestamp);
	};

	const setTimestampToTime = (timestamp: number) => {
		if (timestampFrom) {
			// eslint-disable-next-line no-param-reassign
			timestamp = setDate(timestampFrom, timestamp);
		}
		setTimestampTo(timestamp);
	};

	const onClear = () => {
		eventWindowStore.filterStore.resetEventsFilter();
	};

	const filterConfig: FilterRowConfig[] = [{
		type: 'datetime-range',
		id: 'events-datetime',
		label: 'Events from',
		inputs: [{
			label: 'Events on',
			value: timestampFrom,
			setValue: setTimestampFromDate,
			type: TimeInputType.DATE,
			id: 'events-date',
			inputMask: DATE_INPUT_MASK,
			dateMask: DateTimeMask.DATE_MASK,
			placeholder: DATE_PLACEHOLDER,
			inputClassName: 'events-filter__date-input',
			labelClassName: 'filter-row__label',
		}, {
			label: 'from',
			value: timestampFrom,
			setValue: setTimestampFromTime,
			type: TimeInputType.TIME,
			id: 'events-time-from',
			inputMask: TIME_INPUT_MASK,
			dateMask: DateTimeMask.TIME_MASK,
			placeholder: TIME_PLACEHOLDER,
			inputClassName: 'events-filter__time-input',
		}, {
			label: 'to',
			value: timestampTo,
			setValue: setTimestampToTime,
			type: TimeInputType.TIME,
			id: 'events-time-to',
			inputMask: TIME_INPUT_MASK,
			dateMask: DateTimeMask.TIME_MASK,
			placeholder: TIME_PLACEHOLDER,
			inputClassName: 'events-filter__time-input',
		}],
		timeShortcuts: [{
			label: 'Last 15 minutes',
			onClick: getTimeShortcutHandler(15),
		}, {
			label: 'Last hour',
			onClick: getTimeShortcutHandler(60),
		}, {
			label: 'Today',
			onClick: getTimeShortcutHandler(24 * 60),
		}],
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
