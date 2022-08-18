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
import { FilterRowMultipleStringsConfig } from '../../models/filter/FilterInputs';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../hooks';
import { useSearchStore } from '../../hooks/useSearchStore';
import { MessageFilterState } from '../search-panel/SearchPanelFilters';
import SessionFilter from './SessionFilterRow';
import MessageExport from '../message/MessageExport';
import FilterButton from './FilterButton';
import ReplayModal from '../message/ReplayModal';
import FilterWarning from './FilterWarning';
import {
	useMessageFiltersAutocomplete,
	useSessionAutocomplete,
} from '../../hooks/useMessagesAutocomplete';
import { useFilterConfig } from '../../hooks/useFilterConfig';
import { MessageFilterKeys } from '../../api/sse';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

interface Props {
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
}

const MessagesFilterPanel = (props: Props) => {
	const { showFilter, setShowFilter } = props;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const searchStore = useSearchStore();
	const { filterStore } = messagesStore;

	const autocompleteLists = useMessageFiltersAutocomplete(filterStore.filterInfo);

	const { filter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
		autocompleteLists,
	});

	const [streams, setStreams] = React.useState<Array<string>>([]);
	const [currentStream, setCurrentStream] = React.useState('');

	React.useEffect(() => {
		setStreams(filterStore.filter.streams);
	}, [filterStore.filter.streams]);

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

	return (
		<>
			<FilterButton
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				isLoading={secondaryLoadingStatus}
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
