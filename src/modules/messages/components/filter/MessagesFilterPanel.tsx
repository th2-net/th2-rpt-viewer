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

import React, { useCallback } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import MessagesFilter from 'models/filter/MessagesFilter';
import FilterConfig from 'components/filter/FilterConfig';
import FilterButton from 'components/filter/FilterButton';
import { useFilterConfig } from 'hooks/useFilterConfig';
import useViewMode from 'hooks/useViewMode';
import { ActionFilterConfig, FilterRowConfig } from 'models/filter/FilterInputs';
import { MessageFilterKeys } from 'api/sse';
import { ViewMode } from 'components/ViewModeProvider';
import { useMessageFiltersAutocomplete } from '../../hooks/useMessagesAutocomplete';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useMessagesFilterConfigStore } from '../../hooks/useFilterConfigStore';
import { useFilterStore } from '../../hooks/useFilterStore';
import SessionFilter from './SessionFilterRow';
import FilterWarning from './FilterWarning';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

const MessagesFilterPanel = () => {
	const viewMode = useViewMode();

	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();
	const filterStore = useFilterStore();
	const filterConfigStore = useMessagesFilterConfigStore();
	const [sessions, setSessions] = React.useState<Array<string>>([]);
	const filtersAutocomplete = useMessageFiltersAutocomplete();

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.filter,
		order: filterOrder,
		autocompleteLists: filtersAutocomplete,
	});

	const [showFilter, setShowFilter] = React.useState(false);

	React.useEffect(() => {
		setFilter(filterStore.filter);
	}, [filterStore.filter]);

	const submitChanges = React.useCallback(() => {
		messagesStore.applyFilter(
			{
				...filterStore.params,
				streams: sessions,
			},
			filter as MessagesFilter,
		);
	}, [filter, filterStore, sessions]);

	const isMessageListLoading = computed(
		() =>
			messagesDataStore.isLoading ||
			(filterStore.isSoftFilter &&
				[...messagesDataStore.isMatchingMessages.values()].some(Boolean)),
	).get();

	const secondaryLoadingStatus = computed(
		() =>
			messagesDataStore.messages.length !== 0 &&
			(messagesStore.isFilteringTargetMessages || messagesStore.isLoadingAttachedMessages),
	).get();

	const sseFiltersErrorConfig: ActionFilterConfig = React.useMemo(
		() => ({
			type: 'action',
			id: 'sse-filtler-error',
			message: 'Failed to load sse filters',
			actionButtonText: 'Try again',
			action: filterConfigStore.getMessageFilters,
			isLoading: filterConfigStore.isMessageFiltersLoading,
		}),
		[filterConfigStore.getMessageFilters, filterConfigStore.isMessageFiltersLoading],
	);

	const filterConfig: Array<FilterRowConfig> = React.useMemo(
		() => (config.length ? config : [sseFiltersErrorConfig]),
		[config, sseFiltersErrorConfig],
	);

	const onFilterHistoryClick = useCallback(
		(partialFilter: Partial<MessagesFilter>) => {
			if (filter) {
				setFilter({ ...filter, ...partialFilter });
			}
		},
		[filter, setFilter],
	);

	return (
		<>
			<FilterConfig
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				filter={filter}
				setFilter={onFilterHistoryClick}
				type='message'
			/>
			{viewMode === ViewMode.Full && <FilterWarning />}
			<SessionFilter
				sessions={sessions}
				setSessions={setSessions}
				submitChanges={submitChanges}
				stopLoading={messagesDataStore.stopMessagesLoading}
				isLoading={isMessageListLoading}
			/>
			<FilterButton
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				isLoading={secondaryLoadingStatus}
			/>
		</>
	);
};

export default observer(MessagesFilterPanel);
