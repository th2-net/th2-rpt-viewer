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
import {
	DATE_TIME_INPUT_MASK,
	DATE_TIME_PLACEHOLDER,
	INTERVAL_MASK,
	INTERVAL_PLACEHOLDER,
} from '../../util/filterInputs';
import { DateTimeMask, FilterRowConfig, TimeInputType } from '../../models/filter/FilterInputs';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import { getTimeWindow } from '../../helpers/date';

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWindowStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [timestamp, setTimestamp] = React.useState<number | null>(
		filterStore.dirtyMessagesFilter.timestamp,
	);
	const [timeInterval, setTimeInterval] = React.useState<number | null>(
		filterStore.dirtyMessagesFilter.timeInterval,
	);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>(
		filterStore.dirtyMessagesFilter.streams,
	);
	const [currentMessageType, setCurrentMessageType] = React.useState('');
	const [messageTypes, setMessagesTypes] = React.useState<Array<string>>(
		filterStore.dirtyMessagesFilter.messageTypes,
	);

	React.useEffect(() => {
		if (filterStore.isMessagesFilterApplied) {
			setTimestamp(filterStore.messagesFilter.timestamp);
			setTimeInterval(filterStore.messagesFilter.timeInterval);
			setMessagesTypes(filterStore.messagesFilter.messageTypes);
		}
	}, [filterStore.messagesFilter]);

	React.useEffect(() => {
		if (filterStore.isMessagesFilterApplied) {
			setStreams(filterStore.messagesFilter.streams);
		}
	}, [filterStore.messagesFilter.streams]);

	React.useEffect(() => {
		const { timestampFrom, timestampTo } = getTimeWindow(timestamp, timeInterval, true);

		filterStore.setDirtyMessagesFilter({
			timestamp,
			timeInterval,
			timestampFrom,
			timestampTo,
			streams,
			messageTypes,
		});
	}, [timestamp, timeInterval, streams, messageTypes]);

	const submitChanges = () => {
		const { timestampFrom, timestampTo } = getTimeWindow(timestamp, timeInterval);

		messagesStore.filterStore.setMessagesFilter({
			timestamp,
			timeInterval,
			streams,
			messageTypes,
			timestampFrom,
			timestampTo,
		});
	};

	const clearAllFilters = () => messagesStore.resetMessagesFilter();

	const filterConfig: FilterRowConfig[] = [
		{
			type: 'time-window',
			id: 'messages-time-window',
			label: 'Messages timestamp',
			inputs: [
				{
					label: 'Timestamp',
					value: timestamp,
					setValue: setTimestamp,
					type: TimeInputType.DATE_TIME,
					id: 'messages-timestamp',
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
					id: 'messages-interval',
					inputMask: INTERVAL_MASK,
					placeholder: INTERVAL_PLACEHOLDER,
					inputClassName: 'time-interval',
					labelClassName: 'filter-row__label',
				},
			],
		},
		{
			type: 'multiple-strings',
			id: 'messages-stream',
			label: 'Session name',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: messagesStore.messageSessions,
		},
		{
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

	const isLoading = Object.values(messagesStore.messagesLoadingState).some(Boolean);
	const isApplied = messagesStore.filterStore.isMessagesFilterApplied && !isLoading;

	return (
		<FilterPanel
			isLoading={isLoading}
			isFilterApplied={isApplied}
			count={isApplied ? messagesStore.messagesIds.length : null}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			config={filterConfig}
			onSubmit={submitChanges}
			onClearAll={clearAllFilters}
		/>
	);
};

export default observer(MessagesFilterPanel);
