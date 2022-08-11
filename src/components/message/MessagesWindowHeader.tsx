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

import { observer, Observer } from 'mobx-react-lite';
import React from 'react';
import {
	useMessagesDataStore,
	useMessagesWorkspaceStore,
	useFiltersHistoryStore,
} from '../../hooks';
import MessagesFilter from '../filter/MessagesFilterPanel';
import MessagesUpdateButton from './MessagesUpdateButton';
import FilterConfig from '../filter/FilterConfig';
import {
	FilterRowConfig,
	FilterRowTogglerConfig,
	FilterRowMultipleStringsConfig,
	CompoundFilterRow,
	ActionFilterConfig,
} from '../../models/filter/FilterInputs';
import { MultipleStringFilter, MessageFilterState } from '../search-panel/SearchPanelFilters';
import { getArrayOfUniques } from '../../helpers/array';
import { prettifyCamelcase } from '../../helpers/stringUtils';
import { MessagesFilterInfo } from '../../api/sse';
import { useSearchStore } from '../../hooks/useSearchStore';
import useSetState from '../../hooks/useSetState';
import { notEmpty } from '../../helpers/object';
import FiltersHistory from '../filters-history/FiltersHistory';

type CurrentSSEValues = {
	[key in keyof MessageFilterState]: string;
};

const priority = ['attachedEventIds', 'type', 'body', 'bodyBinary', 'text'];

function MessagesWindowHeader() {
	const { updateStore } = useMessagesDataStore();
	const messagesStore = useMessagesWorkspaceStore();
	const searchStore = useSearchStore();
	const { messagesHistory } = useFiltersHistoryStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);
	const [filter, setFilter] = useSetState<MessageFilterState | null>(filterStore.sseMessagesFilter);
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

		return searchStore.messagesFilterInfo
			.sort((a, b) => {
				return priority.indexOf(a.name) - priority.indexOf(b.name);
			})
			.map<CompoundFilterRow>((filterInfo: MessagesFilterInfo) => {
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
											possibleValues:
												param.name === 'negative' ? ['Exclude', 'Include'] : ['And', 'Or'],
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
			});
	}, [searchStore.messagesFilterInfo, messagesHistory, filter, currentValues]);

	const sseFiltersErrorConfig: ActionFilterConfig = React.useMemo(() => {
		return {
			type: 'action',
			id: 'sse-filter-error',
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
					</div>
				)}
			</Observer>
		);
	}, [filter, isSoftFilterApplied, setIsSoftFilterApplied]);

	return (
		<>
			<div className='messages-window-header'>
				<div className='messages-window-header__group'>
					<MessagesUpdateButton
						isShow={updateStore.canActivate}
						isLoading={updateStore.isActive}
						subscribeOnChanges={updateStore.subscribeOnChanges}
						stopSubscription={updateStore.stopSubscription}
					/>
					<MessagesFilter showFilter={showFilter} setShowFilter={setShowFilter} />
				</div>
			</div>
			<FilterConfig
				showFilter={showFilter}
				config={filterConfig}
				setShowFilter={setShowFilter}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				renderFooter={renderFooter}
			/>
		</>
	);
}

export default observer(MessagesWindowHeader);
