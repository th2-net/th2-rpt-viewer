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

import { observer } from 'mobx-react-lite';
import React, { useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import { useGraphStore } from '../hooks';
import useSetState from '../hooks/useSetState';
import { FilterRowConfig } from '../models/filter/FilterInputs';
import FilterRow from './filter/row';
import TogglerRow from './filter/row/TogglerRow';
import sseApi from '../api/sse';
import { EventAction } from '../models/EventAction';
import { createBemElement } from '../helpers/styleCreators';
import { isEventAction } from '../helpers/event';
import { getTimestampAsNumber } from '../helpers/date';
import { EventMessage } from '../models/EventMessage';

type SearchPanelState = {
	startTimestamp: string;
	type: string[];
	searchDirection: 'next' | 'previous';
	resultCountLimit: string;
	timeLimit: string;
	attachedMessageId: string;
	name: string[];
	parentEvent: string;
	attachedEventIds: string[];
	stream: string[];
	negativeTypeFilter: boolean;
};

const SearchPanel = () => {
	const { timestamp } = useGraphStore();

	const [formType, setFormType] = useState<'event' | 'message'>('event');

	const [currentTypeValue, setCurrentTypeValue] = useState('');
	const [currentAttachedEventIdsValue, setCurrentAttachedEventIdsValue] = useState('');
	const [currentName, setCurrentName] = useState('');
	const [currentStream, setCurrentStream] = useState('');

	const [currentlyLaunchedChannel, setCurrentlyLaunchedChannel] = useState<EventSource | null>(
		null,
	);

	const [events, setEvents] = useState<EventAction[]>([]);

	const defaultState: SearchPanelState = {
		startTimestamp: moment(timestamp).format('DD.MM.YYYY HH:mm:ss:SSS'),
		type: [],
		searchDirection: 'next',
		resultCountLimit: '100',
		timeLimit: '6000000',
		attachedMessageId: '',
		name: [],
		parentEvent: '',
		attachedEventIds: [],
		stream: [],
		negativeTypeFilter: false,
	};

	const [formState, setFormState] = useSetState<SearchPanelState>(defaultState);

	const setTimestamp = (newTimestamp: string) => {
		setFormState(state => ({ ...state, startTimestamp: newTimestamp }));
	};

	const setType = (newTypes: string[]) => {
		setFormState(state => ({ ...state, type: newTypes }));
	};

	const setResultCountLimit = (limit: string) => {
		setFormState(state => ({ ...state, resultCountLimit: limit }));
	};

	const setTimeLimit = (limit: string) => {
		setFormState(state => ({ ...state, timeLimit: limit }));
	};

	const setSearchDirection = (direction: 'next' | 'previous') => {
		setFormState(state => ({ ...state, searchDirection: direction }));
	};

	const setAttachedMessageId = (newId: string) => {
		setFormState(state => ({ ...state, attachedMessageId: newId }));
	};

	const setParentEvent = (newId: string) => {
		setFormState(state => ({ ...state, parentEvent: newId }));
	};

	const setAttachedEventIds = (newIds: string[]) => {
		setFormState(state => ({ ...state, attachedEventIds: newIds }));
	};

	const setName = (names: string[]) => {
		setFormState(state => ({ ...state, name: names }));
	};

	const setStream = (streams: string[]) => {
		setFormState(state => ({ ...state, stream: streams }));
	};

	const toggleNegativeTypeFilter = () => {
		setFormState(state => ({ ...state, negativeTypeFilter: !state.negativeTypeFilter }));
	};

	const commonConfig: FilterRowConfig[] = [
		{
			label: 'Search Direction',
			value: formState.searchDirection,
			setValue: setSearchDirection,
			disabled: false,
			possibleValues: ['next', 'previous'],
			type: 'toggler',
			id: 'search-direction',
		},
		{
			label: 'Start Timestamp',
			value: formState.startTimestamp,
			setValue: setTimestamp,
			type: 'string',
			id: 'start-timestamp',
		},
		{
			type: 'multiple-strings',
			id: 'type',
			label: 'Type',
			values: formState.type,
			setValues: setType,
			currentValue: currentTypeValue,
			setCurrentValue: setCurrentTypeValue,
			autocompleteList: null,
		},
		{
			label: 'Result Count Limit',
			value: formState.resultCountLimit,
			setValue: setResultCountLimit,
			type: 'string',
			id: 'result-count-limit',
		},
		{
			label: 'Time Limit',
			value: formState.timeLimit,
			setValue: setTimeLimit,
			type: 'string',
			id: 'time-limit',
		},
	];

	const eventsFormTypeConfig: FilterRowConfig[] = [
		{
			label: 'Attached MessageId',
			value: formState.attachedMessageId,
			setValue: setAttachedMessageId,
			type: 'string',
			id: 'attached-message-id',
		},
		{
			type: 'multiple-strings',
			id: 'name',
			label: 'Name',
			values: formState.name,
			setValues: setName,
			currentValue: currentName,
			setCurrentValue: setCurrentName,
			autocompleteList: null,
		},
		{
			label: 'Parent Event',
			value: formState.parentEvent,
			setValue: setParentEvent,
			type: 'string',
			id: 'parent-event',
		},
	];

	const messagesFormTypeConfig: FilterRowConfig[] = [
		{
			type: 'multiple-strings',
			id: 'attached-event-ids',
			label: 'Attached Event Ids',
			values: formState.attachedEventIds,
			setValues: setAttachedEventIds,
			currentValue: currentAttachedEventIdsValue,
			setCurrentValue: setCurrentAttachedEventIdsValue,
			autocompleteList: null,
		},
		{
			type: 'multiple-strings',
			id: 'stream',
			label: 'Stream',
			values: formState.stream,
			setValues: setStream,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: null,
		},
		{
			label: 'Negative Type Filter',
			value: formState.negativeTypeFilter,
			setValue: toggleNegativeTypeFilter,
			type: 'checkbox',
			id: 'negative-type-filter',
		},
	];

	const config: FilterRowConfig[] = useMemo(() => {
		if (formType === 'event') {
			return [...commonConfig, ...eventsFormTypeConfig];
		}
		return [...commonConfig, ...messagesFormTypeConfig];
	}, [commonConfig, formType]);

	const launchChannel = useCallback(() => {
		const {
			startTimestamp,
			type,
			searchDirection,
			resultCountLimit,
			timeLimit,
			attachedMessageId,
			name,
			parentEvent,
			attachedEventIds,
			stream,
			negativeTypeFilter,
		} = formState;
		const commonParams = {
			startTimestamp: new Date(startTimestamp).getTime(),
			type,
			searchDirection,
			resultCountLimit,
			timeLimit,
		};
		const queryParams =
			formType === 'event'
				? { ...commonParams, ...{ attachedMessageId, name, parentEvent } }
				: { ...commonParams, ...{ attachedEventIds, stream, negativeTypeFilter } };
		const channel = sseApi.getEventSource({
			type: formType,
			queryParams,
			listener: (ev: Event | MessageEvent) => {
				const data = (ev as MessageEvent).data;
				setEvents(currentEvents => [...currentEvents, JSON.parse(data)]);
			},
			onClose: () => {
				setCurrentlyLaunchedChannel(null);
			},
			onOpen: () => {
				setEvents([]);
			},
		});
		setCurrentlyLaunchedChannel(channel);
	}, [formType, formState]);

	const stopChannel = useCallback(() => {
		currentlyLaunchedChannel?.close();
		setCurrentlyLaunchedChannel(null);
	}, [currentlyLaunchedChannel]);

	return (
		<div className='search-panel'>
			<div className='search-panel__toggle'>
				<TogglerRow
					config={{
						type: 'toggler',
						value: formType,
						disabled: Boolean(currentlyLaunchedChannel),
						setValue: setFormType,
						possibleValues: ['event', 'message'],
						id: 'source-type',
						label: '',
					}}
				/>
			</div>
			<div className='search-panel__form'>
				<div className='search-panel__fields'>
					{config.map(rowConfig => (
						<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
					))}
				</div>
				<div className='search-panel__buttons'>
					<button
						className='search-panel__submit'
						onClick={currentlyLaunchedChannel ? stopChannel : launchChannel}>
						{currentlyLaunchedChannel ? 'stop' : 'start'}
					</button>
				</div>
			</div>
			<div className='search-panel__results'>
				{events.map((item: EventAction | EventMessage) => {
					const itemClass = createBemElement('search-panel', 'item', item.type);
					const itemIconClass = createBemElement('search-panel', 'item-icon', `${item.type}-icon`);
					return (
						<div key={isEventAction(item) ? item.eventId : item.messageId} className={itemClass}>
							<i className={itemIconClass} />
							<div className='bookmarks-panel__item-info'>
								<div className='bookmarks-panel__item-name'>
									{isEventAction(item) ? item.eventName : item.messageId}
								</div>
								<div className='bookmarks-panel__item-timestamp'>
									{moment(
										getTimestampAsNumber(
											isEventAction(item) ? item.startTimestamp : item.timestamp,
										),
									).format('DD.MM.YYYY HH:mm:ss:SSS')}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default observer(SearchPanel);
