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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import {
	FilterRowTimeWindowConfig,
	DateTimeMask,
	TimeInputType,
	FitlerRowItem,
} from 'models/filter/FilterInputs';
import { DATE_TIME_INPUT_MASK } from 'models/util/filterInputs';
import { EventFilterKeys, MessageFilterKeys } from 'api/sse';
import EventsFilter from 'models/filter/EventsFilter';
import { useFilterConfig } from 'hooks/useFilterConfig';
import { FilterRows } from 'components/filter/FilterRows';
import FiltersHistory from 'components/filters-history/FiltersHistory';
import { useSessionsHistoryStore } from 'hooks/useSessionsStore';
import { useFilterConfigStore } from 'hooks/useFilterConfigStore';
import { Button } from 'components/buttons/Button';
import DateTimeRangePicker from 'components/filter/row/DateTimeRangePicker';
import MessagesFilter from 'models/filter/MessagesFilter';
import { useSearchStore } from '../hooks/useSearchStore';
import SearchTypeSwitcher from './search-form/SearchTypeSwitcher';
import SearchSubmit from './search-form/SearchSubmit';

const eventFilterOrder: EventFilterKeys[] = [
	'status',
	'attachedMessageId',
	'type',
	'body',
	'name',
	'event_generic',
];

const messagesFilterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

const SearchPanelForm = () => {
	const {
		formType,
		startSearch,
		stopSearch,
		setFormType,
		isSearching,
		eventsFilterStore,
		messagesFilterStore,
	} = useSearchStore();

	const filterStore = formType === 'event' ? eventsFilterStore : messagesFilterStore;

	const clearFilter = filterStore.clearFilter;

	const filterConfigStore = useFilterConfigStore();

	const disabled = isSearching;

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.filter,
		disabled,
		order: formType === 'event' ? eventFilterOrder : messagesFilterOrder,
	});

	const [currentStream, setCurrentStream] = useState('');
	const [sessions, setSessions] = useState<string[]>([]);
	const sessionsStore = useSessionsHistoryStore();

	useEffect(() => {
		setSessions(messagesFilterStore.params.streams.slice());
	}, [messagesFilterStore.params.streams]);

	const sessionsAutocomplete: string[] = React.useMemo(
		() => [
			...sessionsStore.sessions.map(s => s.session),
			...filterConfigStore.messageSessions.filter(
				session => sessionsStore.sessions.findIndex(s => s.session === session) === -1,
			),
		],
		[filterConfigStore.messageSessions, sessionsStore.sessions],
	);

	const areSessionInvalid: boolean = React.useMemo(
		() =>
			sessions.length === 0 ||
			sessions.some(stream => !filterConfigStore.messageSessions.includes(stream.trim())),
		[sessions, filterConfigStore.messageSessions],
	);

	const sessionsConfig: FitlerRowItem = useMemo(
		() => ({
			type: 'multiple-strings',
			id: 'stream',
			label: 'Session',
			values: sessions,
			setValues: setSessions,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: sessionsAutocomplete,
			isInvalid: areSessionInvalid,
			required: true,
			validateBubbles: true,
		}),
		[sessions, currentStream, setCurrentStream, sessionsAutocomplete, areSessionInvalid],
	);

	const onSearchStart = useCallback(() => {
		if (formType === 'event') {
			eventsFilterStore.setEventsFilter(filter as EventsFilter);
		} else {
			messagesFilterStore.setMessagesFilter(
				{ ...messagesFilterStore.params, streams: sessions },
				filter as MessagesFilter,
			);
		}
		startSearch();
	}, [filterStore, startSearch, sessions, filter]);

	const setStartTimestamp = useCallback(
		(timestamp: number | null) => {
			if (timestamp) {
				filterStore.setStartTimestamp(timestamp);
			}
		},
		[filterStore],
	);

	const setEndTimestamp = useCallback(
		(timestamp: number | null) => {
			if (timestamp) {
				filterStore.setEndTimestamp(timestamp);
			}
		},
		[filterStore],
	);

	const dateTimeRangeConfig: FilterRowTimeWindowConfig = React.useMemo(
		() => ({
			id: 'search-panel-form-timestamps',
			inputs: [
				{
					dateMask: DateTimeMask.DATE_TIME_MASK,
					inputMask: DATE_TIME_INPUT_MASK,
					id: 'search-startTimestamp',
					placeholder: '',
					value: filterStore.startTimestamp,
					setValue: setStartTimestamp,
					type: TimeInputType.DATE_TIME,
				},
				{
					dateMask: DateTimeMask.DATE_TIME_MASK,
					inputMask: DATE_TIME_INPUT_MASK,
					id: 'search-endTimestamp',
					placeholder: '',
					value: filterStore.endTimestamp,
					setValue: setEndTimestamp,
					type: TimeInputType.DATE_TIME,
				},
			],
			type: 'time-window',
		}),
		[setStartTimestamp, setEndTimestamp, filterStore.startTimestamp, filterStore.endTimestamp],
	);

	const filterConfig = useMemo(() => {
		if (formType === 'event') return config;

		return [sessionsConfig, ...config];
	}, [formType, config, sessionsConfig]);

	return (
		<div className='search-panel-form'>
			<DateTimeRangePicker config={dateTimeRangeConfig} />
			<SearchTypeSwitcher formType={formType} setFormType={setFormType} />
			<FilterRows config={filterConfig} />
			<div className='search-panel-form__footer'>
				{/* TODO: fix filter history generic types */}
				{filter && (
					<FiltersHistory
						disabled={disabled}
						type={formType}
						filter={{
							state: filter,
							setState: (partialFilter: any) => {
								setFilter({ ...filter, ...partialFilter });
							},
						}}
					/>
				)}
				<Button
					variant='outlined'
					className={clsx({ disabled })}
					onClick={() => clearFilter()}
					disabled={disabled}>
					Clear All
				</Button>
				<SearchSubmit
					isSearching={isSearching}
					disabled={formType === 'message' && sessions.length === 0}
					startSearch={onSearchStart}
					stopSearch={stopSearch}
				/>
			</div>
		</div>
	);
};

export default observer(SearchPanelForm);
