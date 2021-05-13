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
import { toJS } from 'mobx';
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
		if (filterStore.temporaryFilter) {
			const filtersToSave = Object.fromEntries(
				Object.entries(filterStore.temporaryFilter)
					.filter(([_, value]) => value.values.length > 0)
					.map(([key, value]) => [
						key,
						toJS(typeof value.values === 'string' ? value.values : toJS(value.values).sort()),
					]),
			);
			const timestamp = Date.now();
			if (Object.values(filtersToSave).some(v => v.length > 0)) {
				addHistoryItem({
					timestamp,
					filters: filtersToSave,
					type: 'message',
				});
			}
			addFilter({ ...toJS(filterStore.temporaryFilter), timestamp });
		}
		searchStore.stopSearch();
		messagesStore.applyFilter(
			{
				...filterStore.filter,
				streams,
			},
			filterStore.temporaryFilter,
			isSoftFilterApplied,
		);
	}, [filterStore.filter, streams, isSoftFilterApplied]);

	const isLoading = messagesDataStore.messages.length === 0 && messagesDataStore.isLoading;
	const isApplied = messagesStore.filterStore.isMessagesFilterApplied && !isLoading;

	const compoundFilterRow: Array<CompoundFilterRow> = React.useMemo(() => {
		if (!filterStore.temporaryFilter) return [];
		// eslint-disable-next-line no-underscore-dangle
		const _sseFilter = filterStore.temporaryFilter;
		function getState(
			name: keyof MessageFilterState,
		): MessageFilterState[keyof MessageFilterState] {
			return _sseFilter[name];
		}

		function getValuesUpdater<T extends keyof MessageFilterState>(name: T) {
			return function valuesUpdater<K extends MessageFilterState[T]>(values: K) {
				const filter = filterStore.temporaryFilter;
				if (filter) {
					filterStore.setTemporaryFilter({ [name]: { ...filter[name], values } });
				}
			};
		}

		function getNegativeToggler<T extends keyof MessageFilterState>(name: T) {
			return function negativeToggler() {
				const filter = filterStore.temporaryFilter;
				if (filter) {
					filterStore.setTemporaryFilter({
						[name]: { ...filter[name], negative: !filter[name].negative },
					});
				}
			};
		}

		const setCurrentValue = (name: keyof MessageFilterState) => (value: string) => {
			setCurrentValues(prevState => ({ ...prevState, [name]: value }));
		};

		return searchStore.messagesFilterInfo.map<CompoundFilterRow>((filter: MessagesFilterInfo) => {
			const label = (filter.name.charAt(0).toUpperCase() + filter.name.slice(1))
				.split(/(?=[A-Z])/)
				.join(' ');
			return filter.parameters.map<FilterRowTogglerConfig | FilterRowMultipleStringsConfig>(
				param => {
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
							} as any;
						default:
							return {
								id: filter.name,
								label: '',
								type: 'multiple-strings',
								values: getState(filter.name).values,
								setValues: getValuesUpdater(filter.name),
								currentValue: currentValues[filter.name as keyof MessageFilterState],
								setCurrentValue: setCurrentValue(filter.name),
								autocompleteList: autocompletes.map(item => item[filter.name].values).flat(),
							};
					}
				},
			);
		});
	}, [
		searchStore.messagesFilterInfo,
		filterStore.temporaryFilter,
		filterStore.setTemporaryFilter,
		currentValues,
	]);

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
		if (!messagesStore.filterStore.temporaryFilter) return null;

		return (
			<Observer>
				{() => (
					<div className='filter-footer'>
						{filterStore.temporaryFilter && (
							<FiltersHistory
								type='message'
								sseFilter={{
									state: filterStore.temporaryFilter,
									setState: filterStore.setTemporaryFilter,
								}}
							/>
						)}
						{messagesStore.filterStore.temporaryFilter && (
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
	}, [messagesStore.filterStore.temporaryFilter, isSoftFilterApplied, setIsSoftFilterApplied]);

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
			<MessageFilterWarning />
			<MessagesFilterSessionFilter config={sessionFilterConfig} submitChanges={submitChanges} />
		</>
	);
};

export default observer(MessagesFilterPanel);
