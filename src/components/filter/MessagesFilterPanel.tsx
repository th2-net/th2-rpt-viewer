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
import { observer } from 'mobx-react-lite';
import { useFilterConfigStore } from 'hooks/useFilterConfigStore';
import MessagesFilter from 'models/filter/MessagesFilter';
import FilterPanel from './FilterPanel';
import {
	FilterRowMultipleStringsConfig,
	ActionFilterConfig,
	FilterRowConfig,
} from '../../models/filter/FilterInputs';
import { useFiltersHistoryStore, useMessagesDataStore, useMessagesStore } from '../../hooks';
import SessionFilter from './SessionFilterRow';
import FilterWarning from './FilterWarning';
import ReplayModal from '../message/ReplayModal';
import MessageExport from '../message/MessageExport';
import { useFilterConfig } from '../../hooks/useFilterConfig';
import { MessageFilterKeys } from '../../api/sse';
import {
	useSessionAutocomplete,
	useMessageFiltersAutocomplete,
} from '../../hooks/useMessagesAutocomplete';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

const MessagesFilterPanel = () => {
	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();
	const { onMessageFilterSubmit } = useFiltersHistoryStore();

	const { filterStore } = messagesStore;
	const filterConfigStore = useFilterConfigStore();

	const autocompleteLists = useMessageFiltersAutocomplete(filterStore.filterInfo);

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
		autocompleteLists,
	});

	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentStream, setCurrentStream] = React.useState('');

	const [showFilter, setShowFilter] = React.useState(false);

	React.useEffect(() => {
		setStreams(filterStore.params.streams);
	}, [filterStore.params.streams]);

	const submitChanges = React.useCallback(() => {
		messagesStore.applyFilter(
			{
				...filterStore.params,
				streams,
			},
			filter as MessagesFilter,
		);

		if (filter) {
			onMessageFilterSubmit(filter);
		}
	}, [filter, filterStore.params, streams]);

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

	const sessionsAutocomplete = useSessionAutocomplete();

	const areSessionInvalid: boolean = React.useMemo(
		() =>
			streams.length === 0 ||
			streams.some(stream => !messagesStore.messageSessions.includes(stream.trim())),
		[streams, messagesStore.messageSessions],
	);

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(
		() => ({
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
		}),
		[streams, setStreams, currentStream, setCurrentStream, sessionsAutocomplete],
	);

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

	return (
		<>
			<FilterPanel
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				isLoading={secondaryLoadingStatus}
				type='message'
				filter={filter}
				setFilter={setFilter as any}
			/>
			<ReplayModal />
			<FilterWarning />
			<SessionFilter
				config={sessionFilterConfig}
				submitChanges={submitChanges}
				stopLoading={messagesDataStore.stopMessagesLoading}
				isLoading={isMessageListLoading}
			/>
			<MessageExport
				isExporting={messagesStore.exportStore.isExport}
				enableExport={messagesStore.exportStore.enableExport}
				disableExport={messagesStore.exportStore.disableExport}
				endExport={messagesStore.exportStore.endExport}
				exportAmount={messagesStore.exportStore.exportMessages.length}
			/>
		</>
	);
};

export default observer(MessagesFilterPanel);
