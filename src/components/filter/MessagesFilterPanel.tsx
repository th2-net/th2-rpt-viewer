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
	useMessageFilterAutocompletesStore,
} from '../../hooks';
import { useSearchStore } from '../../hooks/useSearchStore';
import { MessagesFilterInfo } from '../../api/sse';
import { MessageFilterState } from '../search-panel/SearchPanelFilters';
import MessagesFilterSessionFilter from './MessageFilterSessionFilter';
import MessageFilterWarning from './MessageFilterWarning';
import Checkbox from '../util/Checkbox';
import FiltersHistory from '../filters-history/FiltersHistory';
import MessageReplayModal from '../message/MessageReplayModal';
import { getArrayOfUniques } from '../../helpers/array';
import useSetState from '../../hooks/useSetState';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const searchStore = useSearchStore();
	const { addHistoryItem } = useFiltersHistoryStore();
	const { autocompletes, addFilter } = useMessageFilterAutocompletesStore();
	const { filterStore } = messagesStore;

	const [filter, setFilter] = useSetState<MessageFilterState | null>(filterStore.sseMessagesFilter);
	const [showFilter, setShowFilter] = React.useState(false);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentValues, setCurrentValues] = React.useState<CurrentSSEValues>({
		type: '',
		body: '',
		attachedEventIds: '',
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
		});
	}, []);

	const submitChanges = React.useCallback(() => {
		if (filter) {
			const timestamp = Date.now();
			if (Object.values(filter).some(v => v.values.length > 0)) {
				addHistoryItem({
					timestamp,
					filters: filter,
					type: 'message',
				});
			}
			addFilter({ filters: filter, timestamp });
		}
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

	const isLoading = messagesDataStore.messages.length === 0 && messagesDataStore.isLoading;
	const isApplied = messagesStore.filterStore.isMessagesFilterApplied && !isLoading;

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

		function getNegativeToggler<T extends keyof MessageFilterState>(name: T) {
			return function negativeToggler() {
				if (filter) {
					setFilter({
						[name]: { ..._sseFilter[name], negative: !_sseFilter[name].negative },
					});
				}
			};
		}

		const setCurrentValue = (name: keyof MessageFilterState) => (value: string) => {
			setCurrentValues(prevState => ({ ...prevState, [name]: value }));
		};

		return searchStore.messagesFilterInfo.map<CompoundFilterRow>(
			(filterInfo: MessagesFilterInfo) => {
				const label = (filterInfo.name.charAt(0).toUpperCase() + filterInfo.name.slice(1))
					.split(/(?=[A-Z])/)
					.join(' ');

				const autocompleteList = getArrayOfUniques(
					autocompletes
						.filter(item => item.filters[(filterInfo.name as unknown) as keyof MessageFilterState])
						.map(
							item => item.filters[(filterInfo.name as unknown) as keyof MessageFilterState].values,
						)
						.flat(),
				);

				return filterInfo.parameters.map<FilterRowTogglerConfig | FilterRowMultipleStringsConfig>(
					param => {
						switch (param.type.value) {
							case 'boolean':
								return {
									id: `${filterInfo.name}-include`,
									label,
									disabled: false,
									type: 'toggler',
									value: getState(filterInfo.name).negative,
									toggleValue: getNegativeToggler(filterInfo.name),
									possibleValues: ['excl', 'incl'],
									className: 'filter-row__toggler',
								} as any;
							default:
								return {
									id: filterInfo.name,
									label: '',
									type: 'multiple-strings',
									values: getState(filterInfo.name).values,
									setValues: getValuesUpdater(filterInfo.name),
									currentValue: currentValues[filterInfo.name as keyof MessageFilterState],
									setCurrentValue: setCurrentValue(filterInfo.name),
									autocompleteList,
								};
						}
					},
				);
			},
		);
	}, [searchStore.messagesFilterInfo, filter, currentValues]);

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(() => {
		return {
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: messagesStore.messageSessions,
			validateBubbles: true,
			wrapperClassName: 'messages-window-header__session-filter scrollable',
			hint: 'Session name',
		};
	}, [streams, setStreams, currentStream, setCurrentStream, messagesStore.messageSessions]);

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
				isLoadingFilteredItems={isApplied && messagesDataStore.isLoadingSoftFilteredMessages}
				isFilterApplied={isApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				renderFooter={renderFooter}
			/>
			<MessageReplayModal />
			<MessageFilterWarning />
			<MessagesFilterSessionFilter config={sessionFilterConfig} submitChanges={submitChanges} />
		</>
	);
};

export default observer(MessagesFilterPanel);
