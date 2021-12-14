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
import { computed } from 'mobx';
import { Observer, observer } from 'mobx-react-lite';
import FilterPanel from './FilterPanel';
import {
	CompoundFilterRow,
	FilterRowTogglerConfig,
	FilterRowMultipleStringsConfig,
	ActionFilterConfig,
	FilterRowConfig,
} from '../../models/filter/FilterInputs';
import {
	useMessagesDataStore,
	useMessagesWorkspaceStore,
	useFiltersHistoryStore,
	useSessionsStore,
} from '../../hooks';
import { useSearchStore } from '../../hooks/useSearchStore';
import { MessagesFilterInfo } from '../../api/sse';
import { MessageFilterState, MultipleStringFilter } from '../search-panel/SearchPanelFilters';
import MessagesFilterSessionFilter from './MessageFilterSessionFilter';
import MessageFilterWarning from './MessageFilterWarning';
import Checkbox from '../util/Checkbox';
import FiltersHistory from '../filters-history/FiltersHistory';
import MessageReplayModal from '../message/MessageReplayModal';
import { getArrayOfUniques } from '../../helpers/array';
import useSetState from '../../hooks/useSetState';
import { notEmpty } from '../../helpers/object';
import { prettifyCamelcase } from '../../helpers/stringUtils';
import MessageExport from '../message/MessageExport';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const searchStore = useSearchStore();
	const { messagesHistory } = useFiltersHistoryStore();
	const sessionsStore = useSessionsStore();
	const { filterStore } = messagesStore;

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
	const [isSoftFilterApplied, setIsSoftFilterApplied] = React.useState(filterStore.isSoftFilter);

	React.useEffect(() => {
		setFilter(filterStore.sseMessagesFilter);
	}, [filterStore.sseMessagesFilter]);

	React.useEffect(() => {
		setStreams(filterStore.filter.streams);
	}, [filterStore.filter.streams]);

	React.useEffect(() => {
		setIsSoftFilterApplied(filterStore.isSoftFilter);
	}, [filterStore.isSoftFilter]);

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
		searchStore.stopSearch();
		messagesStore.applyFilter(
			{
				...filterStore.filter,
				streams,
			},
			filter,
			isSoftFilterApplied,
		);
	}, [filter, filterStore.filter, streams, isSoftFilterApplied]);

	const isLoading = computed(
		() =>
			(messagesDataStore.messages.length === 0 && messagesDataStore.isLoading) ||
			(filterStore.isSoftFilter &&
				[...messagesDataStore.isMatchingMessages.values()].some(Boolean)) ||
			messagesStore.isLoadingAttachedMessages,
	).get();

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

		return searchStore.messagesFilterInfo.map<CompoundFilterRow>(
			(filterInfo: MessagesFilterInfo) => {
				const state = getState(filterInfo.name);
				const label = prettifyCamelcase(filterInfo.name);
				const autocompleteList = getArrayOfUniques<string>(
					messagesHistory
						.map(item => item.filters[filterInfo.name]?.values)
						.filter(notEmpty)
						.flat(),
				);

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
											possibleValues: param.name === 'negative' ? ['excl', 'incl'] : ['and', 'or'],
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
											autocompleteList,
											hint: filterInfo.hint,
										};
								}
							},
					  )
					: [];
			},
		);
	}, [searchStore.messagesFilterInfo, messagesHistory, filter, currentValues]);

	const sessionsAutocomplete: string[] = React.useMemo(() => {
		return [
			...sessionsStore.sessions.map(s => s.session),
			...messagesStore.messageSessions.filter(
				session => sessionsStore.sessions.findIndex(s => s.session === session) === -1,
			),
		];
	}, [messagesStore.messageSessions, sessionsStore.sessions]);

	const areSessionInvalid: boolean = React.useMemo(() => {
		return (
			streams.length === 0 ||
			streams.some(stream => !messagesStore.messageSessions.includes(stream.trim()))
		);
	}, [streams, messagesStore.messageSessions]);

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(() => {
		return {
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: sessionsAutocomplete,
			validateBubbles: true,
			isInvalid: areSessionInvalid,
			required: true,
			wrapperClassName: 'messages-window-header__session-filter scrollable',
			hint: 'Session name',
		};
	}, [streams, setStreams, currentStream, setCurrentStream, sessionsAutocomplete]);

	const sseFiltersErrorConfig: ActionFilterConfig = React.useMemo(() => {
		return {
			type: 'action',
			id: 'sse-filtler-error',
			message: 'Failed to load sse filters',
			actionButtonText: 'Try again',
			action: searchStore.getMessagesFilters,
			isLoading: searchStore.isMessageFiltersLoading,
		};
	}, [searchStore.getMessagesFilters, searchStore.isMessageFiltersLoading]);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(() => {
		return compoundFilterRow.length ? compoundFilterRow : [sseFiltersErrorConfig];
	}, [compoundFilterRow, sseFiltersErrorConfig]);

	const renderFooter = React.useCallback(() => {
		if (!filter) return null;

		return (
			<Observer>
				{() => (
					<div className='filter-footer'>
						{filter && (
							<FiltersHistory
								type='message'
								sseFilter={{
									state: filter,
									setState: setFilter,
								}}
							/>
						)}
						{filter && (
							<Checkbox
								checked={isSoftFilterApplied}
								onChange={e => {
									setIsSoftFilterApplied(e.target.checked);
								}}
								label='Soft filter'
								id='soft-filter'
							/>
						)}
					</div>
				)}
			</Observer>
		);
	}, [filter, isSoftFilterApplied, setIsSoftFilterApplied]);

	return (
		<>
			<FilterPanel
				isLoading={isLoading}
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				renderFooter={renderFooter}
			/>
			<MessageReplayModal />
			{messagesStore.checkingAttachedMessages ? (
				<div style={{ marginLeft: 5 }} className='filter__loading' />
			) : (
				<MessageFilterWarning />
			)}
			<MessagesFilterSessionFilter config={sessionFilterConfig} submitChanges={submitChanges} />
			<MessageExport
				isExport={messagesStore.exportStore.isExport}
				enableExport={messagesStore.exportStore.enableExport}
				disableExport={messagesStore.exportStore.disableExport}
				endExport={messagesStore.exportStore.endExport}
				exportAmount={messagesStore.exportStore.exportMessages.length}
			/>
		</>
	);
};

export default observer(MessagesFilterPanel);
