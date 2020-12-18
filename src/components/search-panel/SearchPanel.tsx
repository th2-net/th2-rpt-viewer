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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGraphStore } from '../../hooks';
import useSetState from '../../hooks/useSetState';
import TogglerRow from '../filter/row/TogglerRow';
import sseApi from '../../api/sse';
import { EventAction } from '../../models/EventAction';
import { isEventMessage } from '../../helpers/event';
import SearchPanelFilters, {
	FilterState,
	MessageFilterState,
	EventFilterState,
} from './SearchPanelFilters';
import SearchPanelForm from './SearchPanelForm';
import { SSEFilterInfo, SSEFilterParameter } from '../../stores/SearchPanelFiltersStore';
import { useSearchPanelFiltersStore } from '../../hooks/useSearchPanelFiltersStore';
import '../../styles/search-panel.scss';
import SearchPanelResults, { Result, ResultTypes } from './SearchPanelResults';

export type SearchPanelState = {
	startTimestamp: number;
	searchDirection: 'next' | 'previous';
	resultCountLimit: string;
	timeLimit: string;
	parentEvent: string;
	stream: string[];
};

const getFilterParameterDefaultValue = (param: SSEFilterParameter) => {
	if (param.defaultValue === null) {
		switch (param.type.value) {
			case 'boolean':
				return false;
			case 'string':
				return '';
			case 'string[]':
				return [];
			default:
				return null;
		}
	}
	return param.defaultValue;
};

const getDefaultFilterState = (info: SSEFilterInfo[]): FilterState | {} =>
	info.reduce((prev, curr) => {
		return {
			...prev,
			[curr.name]: curr.parameters.reduce((prevParams, currParam) => {
				return { ...prevParams, [currParam.name]: getFilterParameterDefaultValue(currParam) };
			}, {}),
		};
	}, {});

const SearchPanel = () => {
	const { timestamp } = useGraphStore();
	const { eventFilterInfo, messagesFilterInfo } = useSearchPanelFiltersStore();

	const defaultFormState: SearchPanelState = {
		startTimestamp: timestamp,
		searchDirection: 'next',
		resultCountLimit: '100',
		timeLimit: '6000000',
		parentEvent: '',
		stream: [],
	};

	const [formType, setFormType] = useState<'event' | 'message'>('event');

	const toggleFormType = () => {
		setFormType(type => (type === 'event' ? 'message' : 'event'));
	};

	const [formState, setFormState] = useSetState<SearchPanelState>(defaultFormState);
	const [eventFilter, setEventFilter] = useSetState<EventFilterState>();
	const [messagesFilter, setMessagesFilter] = useSetState<MessageFilterState>();

	const [results, setResults] = useState<EventAction[]>([]);
	const [currentlyLaunchedChannel, setCurrentlyLaunchedChannel] = useState<EventSource | null>(
		null,
	);

	useEffect(() => {
		setEventFilter(getDefaultFilterState(eventFilterInfo));
		setMessagesFilter(getDefaultFilterState(messagesFilterInfo));
	}, [eventFilterInfo, messagesFilterInfo]);

	const form = { formType, state: formState, setState: setFormState };
	const filters = useMemo(
		() =>
			formType === 'event'
				? { info: eventFilterInfo, state: eventFilter, setState: setEventFilter }
				: { info: messagesFilterInfo, state: messagesFilter, setState: setMessagesFilter },
		[formType, eventFilter, messagesFilter],
	);

	const launchChannel = useCallback(() => {
		const {
			startTimestamp,
			searchDirection,
			resultCountLimit,
			timeLimit,
			parentEvent,
			stream,
		} = formState;

		const currentFilters = formType === 'event' ? eventFilterInfo : messagesFilterInfo;

		const filterParams = formType === 'event' ? eventFilter : messagesFilter;

		function getFilter<T extends keyof FilterState>(name: T) {
			return filterParams[name];
		}

		const filtersToAdd = currentFilters
			.filter(info => {
				const values = getFilter(info.name).values;
				return values.length !== 0;
			})
			.map(info => info.name);

		const filterValues = filtersToAdd.map(filter => {
			const values = getFilter(filter).values;
			return [`${filter}-values`, values];
		});

		const filterInclusion = filtersToAdd.map(filter => {
			const negative = getFilter(filter).negative;
			return negative ? [`${filter}-negative`, negative] : [];
		});

		const params = {
			startTimestamp,
			searchDirection,
			resultCountLimit,
			timeLimit,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion]),
		};

		const queryParams = formType === 'event' ? { ...params, parentEvent } : { ...params, stream };

		const channel = sseApi.getEventSource({
			type: formType,
			queryParams,
			listener: (ev: Event | MessageEvent) => {
				const data = (ev as MessageEvent).data;
				setResults(res => [...res, JSON.parse(data)]);
			},
			onClose: () => {
				setCurrentlyLaunchedChannel(null);
			},
			onOpen: () => {
				setResults([]);
			},
		});

		setCurrentlyLaunchedChannel(channel);
	}, [formType, formState, eventFilter, messagesFilter]);

	const stopChannel = useCallback(() => {
		currentlyLaunchedChannel?.close();
		setCurrentlyLaunchedChannel(null);
	}, [currentlyLaunchedChannel]);

	const currentResults: Result[] = React.useMemo(() => {
		return results.map(item => ({
			value: item,
			type: isEventMessage(item) ? ResultTypes.MESSAGE : ResultTypes.EVENT,
		}));
	}, [results]);

	return (
		<div className='search-panel'>
			<div className='search-panel__toggle'>
				<TogglerRow
					config={{
						type: 'toggler',
						value: formType === 'event',
						disabled: Boolean(currentlyLaunchedChannel),
						toggleValue: toggleFormType,
						possibleValues: ['event', 'message'],
						id: 'source-type',
						label: '',
					}}
				/>
			</div>
			<div className='search-panel__form'>
				<div className='search-panel__fields'>
					<SearchPanelForm {...form} />
				</div>
				<div className='filters'>
					<SearchPanelFilters {...filters} />
				</div>
				<div className='search-panel__buttons'>
					<button
						className='search-panel__submit'
						onClick={currentlyLaunchedChannel ? stopChannel : launchChannel}>
						{currentlyLaunchedChannel ? 'stop' : 'start'}
					</button>
				</div>
			</div>
			<SearchPanelResults results={currentResults} />
		</div>
	);
};

export default observer(SearchPanel);
