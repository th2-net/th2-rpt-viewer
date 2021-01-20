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
import { DATE_TIME_INPUT_MASK, DATE_TIME_PLACEHOLDER } from '../../util/filterInputs';
import { DateTimeMask, FilterRowConfig, TimeInputType } from '../../models/filter/FilterInputs';
import { useMessagesWorkspaceStore } from '../../hooks';
import { getTimeRange } from '../../helpers/date';

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [timestampFrom, setTimestampFrom] = React.useState(
		filterStore.messagesFilter.timestampFrom,
	);
	const [timestampTo, setTimestampTo] = React.useState(filterStore.messagesFilter.timestampTo);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentMessageType, setCurrentMessageType] = React.useState('');
	const [messageTypes, setMessagesTypes] = React.useState<Array<string>>([]);

	React.useEffect(() => {
		setTimestampFrom(filterStore.messagesFilter.timestampFrom);
		setTimestampTo(filterStore.messagesFilter.timestampTo);
		setMessagesTypes(filterStore.messagesFilter.messageTypes);
	}, [filterStore.messagesFilter]);

	React.useEffect(() => {
		setStreams(filterStore.messagesFilter.streams);
	}, [filterStore.messagesFilter.streams]);

	const submitChanges = () => {
		messagesStore.filterStore.setMessagesFilter({
			streams,
			messageTypes,
			timestampFrom,
			timestampTo,
		});
	};

	const clearAllFilters = () => messagesStore.resetMessagesFilter();

	const getTimeShortcutHandler = (minutesOffset: number) => () => {
		const [from, to] = getTimeRange(minutesOffset);
		setTimestampFrom(from);
		setTimestampTo(to);
	};

	const filterConfig: FilterRowConfig[] = [
		{
			type: 'datetime-range',
			id: 'messages-datetime',
			label: 'Messages from',
			inputs: [
				{
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
					label: 'Last 15 minutes',
					onClick: getTimeShortcutHandler(15),
				},
				{
					label: 'Last hour',
					onClick: getTimeShortcutHandler(60),
				},
				{
					label: 'Today',
					onClick: getTimeShortcutHandler(24 * 60),
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
