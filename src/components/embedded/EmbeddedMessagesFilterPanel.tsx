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
import { MessageFilterState, MultipleStringFilter } from 'modules/search/models/Search';
import {
	CompoundFilterRow,
	FilterRowTogglerConfig,
	FilterRowMultipleStringsConfig,
	ActionFilterConfig,
	FilterRowConfig,
} from '../../models/filter/FilterInputs';
import { MessagesFilterInfo } from '../../api/sse';
import useSetState from '../../hooks/useSetState';
import { prettifyCamelcase } from '../../helpers/stringUtils';
import FilterPanel from '../filter/FilterPanel';
import MessagesFilterSessionFilter from '../filter/MessageFilterSessionFilter';
import EmbeddedMessagesStore from './embedded-stores/EmbeddedMessagesStore';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

const EmbeddedMessagesFilterPanel = ({
	messagesStore,
}: {
	messagesStore: EmbeddedMessagesStore;
}) => {
	const messagesDataStore = messagesStore.dataStore;
	const { filterStore } = messagesStore;
	const { messagesFilterInfo } = filterStore;

	const [filter, setFilter] = useSetState<MessageFilterState | null>(filterStore.sseMessagesFilter);
	const [showFilter, setShowFilter] = React.useState(false);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentValues, setCurrentValues] = React.useState<CurrentSSEValues>({
		type: '',
		body: '',
		attachedEventIds: '',
		bodyBinary: '',
		text: '',
	});

	React.useEffect(() => {
		setFilter(filterStore.sseMessagesFilter);
	}, [filterStore.sseMessagesFilter]);

	React.useEffect(() => {
		setStreams(filterStore.filter.streams);
	}, [filterStore.filter.streams]);

	React.useEffect(() => {
		setCurrentValues({
			type: '',
			body: '',
			attachedEventIds: '',
			bodyBinary: '',
			text: '',
		});
	}, []);

	const submitChanges = React.useCallback(() => {
		messagesStore.applyFilter(
			{
				...filterStore.filter,
				streams,
			},
			filter,
		);
	}, [filter, filterStore.filter, streams]);

	const compoundFilterRow: Array<CompoundFilterRow> = React.useMemo(() => {
		if (!filter || Object.keys(filter).length === 0) return [];
		// eslint-disable-next-line no-underscore-dangle
		const _sseFilter = filter;

		function getState(
			name: keyof MessageFilterState,
		): MessageFilterState[keyof MessageFilterState] {
			return _sseFilter[name];
		}

		function getValuesUpdater<T extends keyof MessageFilterState>(name: T) {
			return function valuesUpdater<K extends MessageFilterState[T]>(values: K) {
				if (_sseFilter) {
					setFilter({ [name]: { ..._sseFilter[name], values } });
				}
			};
		}

		function getToggler<T extends keyof MessageFilterState>(
			filterName: T,
			paramName: keyof MultipleStringFilter,
		) {
			return function toggler() {
				if (filter) {
					setFilter({
						[filterName]: {
							..._sseFilter[filterName],
							[paramName]: !_sseFilter[filterName][paramName],
						},
					});
				}
			};
		}

		const setCurrentValue = (name: keyof MessageFilterState) => (value: string) => {
			setCurrentValues((prevState: CurrentSSEValues) => ({ ...prevState, [name]: value }));
		};

		return messagesFilterInfo.map<CompoundFilterRow>((filterInfo: MessagesFilterInfo) => {
			const state = getState(filterInfo.name);
			const label = prettifyCamelcase(filterInfo.name);

			return state
				? filterInfo.parameters.map<FilterRowTogglerConfig | FilterRowMultipleStringsConfig>(
						param => {
							switch (param.type.value) {
								case 'boolean':
									return {
										id: `${filterInfo.name}-${param.name}`,
										label: param.name === 'negative' ? label : '',
										disabled: false,
										type: 'toggler',
										value: state[param.name as keyof MultipleStringFilter],
										toggleValue: getToggler(
											filterInfo.name,
											param.name as keyof MultipleStringFilter,
										),
										options: param.name === 'negative' ? ['excl', 'incl'] : ['and', 'or'],
										className: 'filter-row__toggler',
									} as any;
								default:
									return {
										id: filterInfo.name,
										label: '',
										type: 'multiple-strings',
										values: state.values,
										setValues: getValuesUpdater(filterInfo.name),
										currentValue: currentValues[filterInfo.name as keyof MessageFilterState],
										setCurrentValue: setCurrentValue(filterInfo.name),
										hint: filterInfo.hint,
									};
							}
						},
				  )
				: [];
		});
	}, [messagesFilterInfo, filter, currentValues]);

	const areSessionInvalid: boolean = streams.length === 0;

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(
		() => ({
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			validateBubbles: true,
			isInvalid: areSessionInvalid,
			required: true,
			wrapperClassName: 'messages-window-header__session-filter scrollable',
			hint: 'Session name',
		}),
		[streams, setStreams, currentStream, setCurrentStream],
	);

	const sseFiltersErrorConfig: ActionFilterConfig = React.useMemo(
		() => ({
			type: 'action',
			id: 'sse-filtler-error',
			message: 'Failed to load sse filters',
			actionButtonText: 'Try again',
			action: () => null,
			isLoading: false,
		}),
		[],
	);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(
		() => (compoundFilterRow.length ? compoundFilterRow : [sseFiltersErrorConfig]),
		[compoundFilterRow, sseFiltersErrorConfig],
	);

	return (
		<>
			<FilterPanel
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				isLoading={false}
			/>
			<MessagesFilterSessionFilter
				config={sessionFilterConfig}
				submitChanges={submitChanges}
				stopLoading={messagesDataStore.stopMessagesLoading}
				isLoading={messagesDataStore.isLoading}
			/>
		</>
	);
};

export default observer(EmbeddedMessagesFilterPanel);
