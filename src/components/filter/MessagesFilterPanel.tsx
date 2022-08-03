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
import { useMessagesDataStore, useMessagesWorkspaceStore, useSessionsStore } from '../../hooks';
import { useSearchStore } from '../../hooks/useSearchStore';
import { MessageFilterState } from '../search-panel/SearchPanelFilters';
import MessagesFilterSessionFilter from './MessageFilterSessionFilter';
import MessageFilterWarning from './MessageFilterWarning';
import MessageReplayModal from '../message/MessageReplayModal';
import useSetState from '../../hooks/useSetState';
import MessageExport from '../message/MessageExport';
import FilterButton from './FilterButton';

interface Props {
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
}

const MessagesFilterPanel = (props: Props) => {
	const { showFilter, setShowFilter } = props;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const searchStore = useSearchStore();
	const sessionsStore = useSessionsStore();
	const { filterStore } = messagesStore;

	const [filter, setFilter] = useSetState<MessageFilterState | null>(filterStore.sseMessagesFilter);
	const [currentStream, setCurrentStream] = React.useState('');
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
			filter,
			isSoftFilterApplied,
		);
	}, [filter, filterStore.filter, streams, isSoftFilterApplied]);

	const stopLoading = React.useCallback(() => {
		messagesDataStore.stopMessagesLoading();
	}, []);

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

	return (
		<>
			<FilterButton
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				isLoading={secondaryLoadingStatus}
			/>
			<MessageReplayModal />
			<MessageFilterWarning />
			<MessagesFilterSessionFilter
				config={sessionFilterConfig}
				submitChanges={submitChanges}
				stopLoading={stopLoading}
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
