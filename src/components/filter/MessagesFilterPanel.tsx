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
import moment from 'moment';
import FilterPanel from './FilterPanel';
import {
	DATE_TIME_INPUT_MASK,
	DATE_TIME_PLACEHOLDER,
} from '../../util/filterInputs';
import {
	FilterRowConfig,
	TimeInputType,
	DateTimeMask,
} from '../../models/filter/FilterInputs';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWindowStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [timestampFrom, setTimestampFrom] = React.useState(filterStore.messagesFilter.timestampFrom);
	const [timestampTo, setTimestampTo] = React.useState(filterStore.messagesFilter.timestampTo);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentMessageType, setCurrentMessageType] = React.useState('');
	const [messageTypes, setMessagesTypes] = React.useState<Array<string>>([]);
	const [autocompleteSessions] = React.useState<string[]>(messagesStore.messageSessions);

	React.useEffect(() => {
		setTimestampFrom(filterStore.messagesFilter.timestampFrom);
		setTimestampTo(filterStore.messagesFilter.timestampTo);
		setStreams(filterStore.messagesFilter.streams);
		setMessagesTypes(filterStore.messagesFilter.messageTypes);
	}, [filterStore.messagesFilter]);

	const submitChanges = () => {
		if ((timestampFrom && timestampTo) && timestampFrom > timestampTo) {
			// eslint-disable-next-line no-alert
			window.alert('Invalid messagesFilter filter');
			return;
		}

		messagesStore.filterStore.setMessagesFilter({
			timestampFrom,
			timestampTo,
			streams,
			messageTypes,
		});
	};

	const clearAllFilters = () => messagesStore.resetMessagesFilter();

	const getTimeShortcutHandler = (minutesOffset: number) => () => {
		setTimestampFrom(moment().subtract(minutesOffset, 'minutes').valueOf());
		setTimestampTo(moment.now());
	};

	const filterConfig: FilterRowConfig[] = [{
		type: 'datetime-range',
		id: 'messages-datetime',
		label: 'Messages from',
		inputs: [{
			label: 'Messages from',
			value: timestampFrom,
			setValue: setTimestampFrom,
			type: TimeInputType.DATE_TIME,
			id: 'messages-from',
			inputMask: DATE_TIME_INPUT_MASK,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: DATE_TIME_PLACEHOLDER,
			labelClassName: 'filter-row__label',
		},
		{
			label: 'to',
			value: timestampTo,
			setValue: setTimestampTo,
			type: TimeInputType.DATE_TIME,
			id: 'messages-to',
			inputMask: DATE_TIME_INPUT_MASK,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: DATE_TIME_PLACEHOLDER,
		},
		],
		timeShortcuts: [
			{
				label: 'last 15 minutes',
				onClick: getTimeShortcutHandler(15),
			},
			{
				label: 'last hour',
				onClick: getTimeShortcutHandler(60),
			},
			{
				label: 'last day',
				onClick: getTimeShortcutHandler(24 * 60),
			},
		],
	}, {
		type: 'multiple-strings',
		id: 'messages-stream',
		label: 'Session name',
		values: streams,
		setValues: setStreams,
		currentValue: currentStream,
		setCurrentValue: setCurrentStream,
		autocompleteList: autocompleteSessions,
	}, {
		type: 'multiple-strings',
		id: 'messages-type',
		label: 'Message name',
		values: messageTypes,
		setValues: setMessagesTypes,
		currentValue: currentMessageType,
		setCurrentValue: setCurrentMessageType,
		autocompleteList: null,
	},
	];

	const isApplied = messagesStore.filterStore.isMessagesFilterApplied && !messagesStore.isLoading;

	return (
		<FilterPanel
			isLoading={messagesStore.isLoading}
			isFilterApplied={isApplied}
			count={isApplied ? messagesStore.messagesIds.length : null}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			config={filterConfig}
			onSubmit={submitChanges}
			onClearAll={clearAllFilters}/>
	);
};

export default observer(MessagesFilterPanel);
