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
	CompoundFilterRow,
	FilterRowConfig,
	FilterRowTogglerConfig,
	FilterRowMultipleStringsConfig,
} from '../../models/filter/FilterInputs';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../hooks';
import { useSearchStore } from '../../hooks/useSearchStore';
import { SSEFilterInfo, SSEFilterParameter } from '../../api/sse';
import { MessageFilterState } from '../search-panel/SearchPanelFilters';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const searchStore = useSearchStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [sseFilter, setSSEFilter] = React.useState<MessageFilterState | null>(null);
	const [currentValues, setCurrentValues] = React.useState<CurrentSSEValues>({
		type: '',
		body: '',
		attachedEventIds: '',
	});

	React.useEffect(() => {
		setStreams(filterStore.messagesFilter.streams);
	}, [filterStore.messagesFilter.streams]);

	React.useEffect(() => {
		setSSEFilter(messagesStore.filterStore.sseMessagesFilter);
	}, [messagesStore.filterStore.sseMessagesFilter]);

	const submitChanges = React.useCallback(() => {
		messagesStore.applyFilter(
			{
				...filterStore.messagesFilter,
				streams,
			},
			sseFilter,
		);
	}, [filterStore.messagesFilter, streams, sseFilter]);

	const isLoading = messagesDataStore.messages.length === 0 && messagesDataStore.isLoading;
	const isApplied = messagesStore.filterStore.isMessagesFilterApplied && !isLoading;

	const compoundFilterRow: Array<CompoundFilterRow> = React.useMemo(() => {
		if (!sseFilter) return [];
		// eslint-disable-next-line no-underscore-dangle
		const _sseFilter = sseFilter;
		function getState(
			name: keyof MessageFilterState,
		): MessageFilterState[keyof MessageFilterState] {
			return _sseFilter[name];
		}

		function getValuesUpdater<T extends keyof MessageFilterState>(name: T) {
			return function valuesUpdater<K extends MessageFilterState[T]>(values: K) {
				setSSEFilter(prevState => {
					if (prevState !== null) {
						return {
							...prevState,
							[name]: { ...prevState[name], values },
						};
					}

					return prevState;
				});
			};
		}

		function getNegativeToggler<T extends keyof MessageFilterState>(name: T) {
			return function negativeToggler() {
				setSSEFilter(prevState => {
					if (prevState !== null) {
						return {
							...prevState,
							[name]: { ...prevState[name], negative: !prevState[name].negative },
						};
					}

					return prevState;
				});
			};
		}

		const setCurrentValue = (name: keyof MessageFilterState) => (value: string) => {
			setCurrentValues(prevState => ({ ...prevState, [name]: value }));
		};

		return searchStore.messagesFilterInfo.map<CompoundFilterRow>((filter: SSEFilterInfo) => {
			const label = (filter.name.charAt(0).toUpperCase() + filter.name.slice(1))
				.split(/(?=[A-Z])/)
				.join(' ');
			return filter.parameters.map<FilterRowTogglerConfig | FilterRowMultipleStringsConfig>(
				(param: SSEFilterParameter) => {
					switch (param.type.value) {
						case 'boolean':
							return {
								id: `${filter.name}-include`,
								label,
								disabled: false,
								type: 'toggler',
								value: getState(filter.name).negative,
								toggleValue: getNegativeToggler(filter.name),
								possibleValues: ['excl', 'incl'],
								className: 'filter-row__toggler',
							};
						default:
							return {
								id: filter.name,
								label: '',
								type: 'multiple-strings',
								values: getState(filter.name).values,
								setValues: getValuesUpdater(filter.name),
								currentValue: currentValues[filter.name as keyof MessageFilterState],
								setCurrentValue: setCurrentValue(filter.name),
								autocompleteList: null,
							};
					}
				},
			);
		});
	}, [searchStore.messagesFilterInfo, sseFilter, setSSEFilter]);

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(() => {
		return {
			type: 'multiple-strings',
			id: 'messages-stream',
			label: 'Session name',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: messagesStore.messageSessions,
		};
	}, [streams, setStreams, currentStream, setCurrentStream, messagesStore.messageSessions]);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(() => {
		return [sessionFilterConfig, ...compoundFilterRow];
	}, [sessionFilterConfig, compoundFilterRow]);

	return (
		<FilterPanel
			isLoading={isLoading}
			isFilterApplied={isApplied}
			count={isApplied ? messagesDataStore.messages.length : null}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			config={filterConfig}
			onSubmit={submitChanges}
			onClearAll={messagesStore.clearFilters}
		/>
	);
};

export default observer(MessagesFilterPanel);
