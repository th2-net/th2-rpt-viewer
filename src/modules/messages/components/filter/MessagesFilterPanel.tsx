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

import React, { useMemo } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import MessagesFilter from 'models/filter/MessagesFilter';
import FilterConfig from 'components/filter/FilterConfig';
import FilterButton from 'components/filter/FilterButton';
import { useFilterConfig } from 'hooks/useFilterConfig';
import useViewMode from 'hooks/useViewMode';
import {
	FilterRowMultipleStringsConfig,
	ActionFilterConfig,
	FilterRowConfig,
} from 'models/filter/FilterInputs';
import { MessageFilterKeys } from 'api/sse';
import { ViewMode } from 'components/ViewModeProvider';
import {
	useMessageFiltersAutocomplete,
	useSessionAutocomplete,
} from '../../hooks/useMessagesAutocomplete';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useMessagesFilterConfigStore } from '../../hooks/useFilterConfigStore';
import { useFilterStore } from '../../hooks/useFilterStore';
import SessionFilter from './SessionFilterRow';
import FilterWarning from './FilterWarning';
import ReplayModal from './ReplayModal';
import MessageExport from '../MessageExport';

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

	const filtersAutocomplete = useMessageFiltersAutocomplete();

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
		autocompleteLists: filtersAutocomplete,
	});

	const [showFilter, setShowFilter] = React.useState(false);
	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentStream, setCurrentStream] = React.useState('');

	React.useEffect(() => {
		setFilter(filterStore.sseMessagesFilter);
	}, [filterStore.sseMessagesFilter]);

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
			messagesStore.saveFilter(filter);
		}

		if (streams.length) {
			messagesStore.saveSessions(streams);
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

	const reportURL = useMemo(() => {
		if (viewMode !== ViewMode.EmbeddedMessages) return undefined;

		const messagesStoreState = {
			timestampFrom: messagesStore.filterStore.params.timestampFrom,
			timestampTo: messagesStore.filterStore.params.timestampTo,
			streams: messagesStore.filterStore.params.streams,
			sse: messagesStore.filterStore.sseMessagesFilter,
			isSoftFilter: false,
		};

		const searchString = new URLSearchParams({
			workspaces: window.btoa(
				JSON.stringify([
					{
						messages: messagesStoreState,
					},
				]),
			),
		});

		return [window.location.origin, window.location.pathname, `?${searchString}`].join('');
	}, [viewMode, messagesStore.filterStore.params, messagesStore.filterStore.sseMessagesFilter]);

	return (
		<>
			<FilterButton
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				isLoading={secondaryLoadingStatus}
			/>
			<FilterConfig
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				config={filterConfig}
				onSubmit={submitChanges}
				onClearAll={messagesStore.clearFilters}
				filter={filter}
				setFilter={setFilter as any}
				type='message'
			/>
			{viewMode !== ViewMode.EmbeddedMessages && (
				<>
					<ReplayModal />
					<FilterWarning />
				</>
			)}
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
			<a href={reportURL} rel='noreferrer' target='_blank' className='report-viewer-link'>
				Report viewer
			</a>
		</>
	);
};

export default observer(MessagesFilterPanel);
