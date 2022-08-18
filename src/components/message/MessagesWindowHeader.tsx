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
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../hooks';
import MessagesFilter from '../filter/MessagesFilterPanel';
import MessagesUpdateButton from './MessagesUpdateButton';
import FilterConfig from '../filter/FilterConfig';
import { ActionFilterConfig, FilterRowConfig } from '../../models/filter/FilterInputs';
import { MessageFilterState } from '../search-panel/SearchPanelFilters';
import { MessageFilterKeys } from '../../api/sse';
import { useSearchStore } from '../../hooks/useSearchStore';
import FiltersHistory from '../filters-history/FiltersHistory';
import { useFilterConfig } from '../../hooks/useFilterConfig';
import { useMessageFiltersAutocomplete } from '../../hooks/useMessagesAutocomplete';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

function MessagesWindowHeader() {
	const { updateStore } = useMessagesDataStore();
	const messagesStore = useMessagesWorkspaceStore();
	const searchStore = useSearchStore();
	const { filterStore } = messagesStore;

	const [showFilter, setShowFilter] = React.useState(false);

	const autocompleteLists = useMessageFiltersAutocomplete(filterStore.filterInfo);

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
		autocompleteLists,
	});
	const [streams, setStreams] = React.useState<Array<string>>([]);

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

	const submitChanges = React.useCallback(() => {
		searchStore.stopSearch();
		messagesStore.applyFilter(
			{
				...filterStore.filter,
				streams,
			},
			filter as MessageFilterState,
		);
	}, [filter, filterStore.filter, streams, filterStore.isSoftFilter]);

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
		return config.length ? config : [sseFiltersErrorConfig];
	}, [config, sseFiltersErrorConfig]);

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
									setState: setFilter as any,
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
