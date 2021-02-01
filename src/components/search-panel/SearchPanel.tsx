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
import React, { useEffect, useMemo, useState, useReducer, useCallback } from 'react';
import { useActivePanel, useActiveWorkspace, useGraphDataStore } from '../../hooks';
import useSetState from '../../hooks/useSetState';
import TogglerRow from '../filter/row/TogglerRow';
import sseApi, { SSEParams } from '../../api/sse';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import SearchPanelFilters, {
	FilterState,
	MessageFilterState,
	EventFilterState,
} from './SearchPanelFilters';
import SearchPanelForm from './SearchPanelForm';
import { SSEFilterInfo, SSEFilterParameter } from '../../stores/SearchPanelFiltersStore';
import { useSearchPanelFiltersStore } from '../../hooks/useSearchPanelFiltersStore';
import SearchPanelResults from './SearchPanelResults';
import SearchPanelProgressBar from './SearchPanelProgressBar';
import useLocalStorage from '../../hooks/useLocalStorage';
import { FilterRowTogglerConfig } from '../../models/filter/FilterInputs';
import '../../styles/search-panel.scss';

export type SearchPanelState = {
	startTimestamp: number;
	searchDirection: 'next' | 'previous';
	resultCountLimit: string;
	endTimestamp: number | null;
	parentEvent: string;
	stream: string[];
};

export type Result = EventTreeNode | EventMessage;

export type SearchHistory = {
	timestamp: number;
	results: Array<Result>;
	request: StateHistory;
};

type SearchPanelType = 'event' | 'message';

type StateHistory = {
	type: SearchPanelType;
	state: SearchPanelState;
	filters: EventFilterState | MessageFilterState;
};

type Counter = {
	index: number;
	limit: number;
	disableForward: boolean;
	disableBackward: boolean;
};

type Action = {
	type: 'forward' | 'backward' | 'set';
	payload?: number;
};

const resultsCounter = (counter: Counter, action: Action): Counter => {
	const { index, limit } = counter;
	switch (action.type) {
		case 'forward':
			if (index + 1 > limit) {
				return { index, limit, disableForward: true, disableBackward: false };
			}
			return {
				index: index + 1,
				limit,
				disableForward: index + 1 === limit,
				disableBackward: false,
			};
		case 'backward':
			if (index - 1 <= 0) {
				return { index: 0, limit, disableForward: false, disableBackward: true };
			}
			return { index: index - 1, limit, disableForward: false, disableBackward: false };
		case 'set':
			return {
				index: Number(action.payload) - 1,
				limit: Number(action.payload) - 1,
				disableForward: true,
				disableBackward: false,
			};
		default:
			return { index, limit, disableForward: false, disableBackward: false };
	}
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
	const graphDataStore = useGraphDataStore();
	const { eventFilterInfo, messagesFilterInfo } = useSearchPanelFiltersStore();
	const activeWorkspace = useActiveWorkspace();
	const { ref: searchPanelRef } = useActivePanel(null);

	const [formType, setFormType] = useState<SearchPanelType>('event');

	const toggleFormType = () => {
		setFormType(type => (type === 'event' ? 'message' : 'event'));
	};

	const [eventFilter, setEventFilter] = useSetState<EventFilterState>();
	const [messagesFilter, setMessagesFilter] = useSetState<MessageFilterState>();
	const [currentRequestResults, setCurrentRequestResults] = useState<Result[]>([]);
	const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistory[]>('search-history', []);
	const [userStartSearch, setUserStartSearch] = useState<null | number>(null);
	const [currentlyLaunchedChannel, setCurrentlyLaunchedChannel] = useState<EventSource | null>(
		null,
	);
	const [currentProgressBarPoint, setCurrentProgressBarPoint] = useState(0);

	const [resultsCounterState, dispatch] = useReducer(resultsCounter, {
		index: searchHistory.length === 0 ? 0 : searchHistory.length - 1,
		limit: searchHistory.length - 1,
		disableForward: true,
		disableBackward: false,
	});

	const { index, disableForward, disableBackward } = resultsCounterState;
	const currentResult = searchHistory[index];
	const [formState, setFormState] = useSetState<SearchPanelState>({
		startTimestamp: graphDataStore.range[0],
		searchDirection: 'next',
		resultCountLimit: '100',
		endTimestamp: null,
		parentEvent: '',
		stream: [],
	});
	const { startTimestamp } = formState;
	const progressBar = {
		startTimestamp: formState.startTimestamp,
		endTimestamp: formState.endTimestamp,
		currentPoint: currentProgressBarPoint,
		searching: Boolean(currentlyLaunchedChannel),
	};
	const filterParams = formType === 'event' ? eventFilter : messagesFilter;
	const disableForm = searchHistory.length > 1 && index !== searchHistory.length - 1;
	const form = useMemo(
		() => ({ formType, state: formState, setState: setFormState, disableAll: disableForm }),
		[formType, formState, disableForm],
	);
	const filters = useMemo(
		() =>
			formType === 'event'
				? {
						info: eventFilterInfo,
						state: eventFilter,
						setState: setEventFilter,
						disableAll: disableForm,
				  }
				: {
						info: messagesFilterInfo,
						state: messagesFilter,
						setState: setMessagesFilter,
						disableAll: disableForm,
				  },
		[formType, eventFilter, messagesFilter, disableForm],
	);

	const formTypeTogglerConfig: FilterRowTogglerConfig = useMemo(
		() => ({
			type: 'toggler',
			value: formType === 'event',
			disabled: disableForm,
			toggleValue: toggleFormType,
			possibleValues: ['event', 'message'],
			id: 'source-type',
			label: '',
		}),
		[formType, disableForm],
	);

	const getFilter = useCallback(
		function getFilter<T extends keyof FilterState>(name: T) {
			return filterParams[name];
		},
		[filterParams],
	);

	const launchChannel = () => {
		setCurrentRequestResults([]);
		setUserStartSearch(Date.now());
	};

	const stopChannel = () => {
		currentlyLaunchedChannel?.close();
		setCurrentlyLaunchedChannel(null);
	};

	const onChannelResponse = useCallback(
		(ev: Event | MessageEvent) => {
			const data = (ev as MessageEvent).data;
			const searchedEventTimestamp = JSON.parse((ev as MessageEvent).lastEventId).timestamp;
			setCurrentProgressBarPoint(searchedEventTimestamp - formState.startTimestamp);
			setCurrentRequestResults(res => [...res, JSON.parse(data)]);
		},
		[startTimestamp],
	);

	const delSearchHistoryItem = () => {
		setSearchHistory((history: SearchHistory[]) => [
			...history.slice(0, index),
			...history.slice(index + 1),
		]);
	};

	useEffect(() => {
		if (currentlyLaunchedChannel) {
			currentlyLaunchedChannel.addEventListener(formType, onChannelResponse);
			currentlyLaunchedChannel.addEventListener('close', () => {
				currentlyLaunchedChannel.close();
				setCurrentlyLaunchedChannel(null);
			});
		}
	}, [currentlyLaunchedChannel, formType]);

	useEffect(() => {
		setEventFilter(getDefaultFilterState(eventFilterInfo));
		setMessagesFilter(getDefaultFilterState(messagesFilterInfo));
	}, [eventFilterInfo, messagesFilterInfo]);

	useEffect(() => {
		dispatch({ type: 'set', payload: searchHistory.length });
	}, [searchHistory]);

	useEffect(() => {
		if (!userStartSearch) {
			return;
		}
		const {
			startTimestamp: _startTimestamp,
			searchDirection,
			resultCountLimit,
			endTimestamp,
			parentEvent,
			stream,
		} = formState;

		const filtersToAdd = filters.info
			.filter((info: SSEFilterInfo) => getFilter(info.name).values.length !== 0)
			.map((info: SSEFilterInfo) => info.name);

		const filterValues = filtersToAdd.map(filter => {
			const values = getFilter(filter).values;
			return [`${filter}-values`, values];
		});

		const filterInclusion = filtersToAdd.map(filter => {
			const negative = getFilter(filter).negative;
			return negative ? [`${filter}-negative`, negative] : [];
		});

		const params = {
			_startTimestamp,
			searchDirection,
			resultCountLimit,
			endTimestamp,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion]),
		};

		const queryParams: SSEParams =
			formType === 'event' ? { ...params, parentEvent } : { ...params, stream };
		setCurrentlyLaunchedChannel(
			sseApi.getEventSource({
				type: formType,
				queryParams,
			}),
		);
	}, [userStartSearch]);

	useEffect(() => {
		if (!currentlyLaunchedChannel && userStartSearch && currentRequestResults.length > 0) {
			setSearchHistory((history: SearchHistory[]) => [
				...history,
				{
					results: currentRequestResults,
					timestamp: userStartSearch,
					request: { type: formType, state: formState, filters: filterParams },
				},
			]);
		}
	}, [currentlyLaunchedChannel, userStartSearch, currentRequestResults]);

	useEffect(() => {
		if (searchHistory[index]) {
			const request = searchHistory[index].request;
			setFormType(request.type);
			setFormState(request.state);

			if (request.type === 'event') {
				setEventFilter(request.filters);
			} else {
				setMessagesFilter(request.filters);
			}
		}
	}, [index, searchHistory]);

	return (
		<div className='search-panel' ref={searchPanelRef}>
			<div className='search-panel__toggle'>
				<TogglerRow config={formTypeTogglerConfig} />
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
						disabled={disableForm}
						className='search-panel__submit'
						onClick={currentlyLaunchedChannel ? stopChannel : launchChannel}>
						{currentlyLaunchedChannel ? 'stop' : 'start'}
					</button>
				</div>
			</div>
			<SearchPanelProgressBar {...progressBar} />
			{currentResult && (
				<SearchPanelResults
					results={currentResult.results}
					timestamp={currentResult.timestamp}
					onResultItemClick={activeWorkspace.onSavedItemSelect}
					onResultDelete={delSearchHistoryItem}
					showToggler={searchHistory.length > 1}
					next={() => {
						dispatch({ type: 'forward' });
					}}
					prev={() => {
						dispatch({ type: 'backward' });
					}}
					disableNext={disableForward}
					disablePrev={disableBackward}
				/>
			)}
		</div>
	);
};

export default observer(SearchPanel);
