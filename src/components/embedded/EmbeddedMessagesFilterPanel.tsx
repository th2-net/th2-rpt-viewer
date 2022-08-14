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
import { observer } from 'mobx-react-lite';
import MessagesFilter from 'models/filter/MessagesFilter';
import {
	FilterRowMultipleStringsConfig,
	ActionFilterConfig,
	FilterRowConfig,
} from '../../models/filter/FilterInputs';
import { MessageFilterKeys } from '../../api/sse';
import FilterPanel from '../filter/FilterPanel';
import MessagesFilterSessionFilter from '../filter/SessionFilterRow';
import EmbeddedMessagesStore from './embedded-stores/EmbeddedMessagesStore';
import { useFilterConfig } from '../../hooks/useFilterConfig';

const filterOrder: MessageFilterKeys[] = [
	'attachedEventIds',
	'type',
	'body',
	'bodyBinary',
	'message_generic',
];

const EmbeddedMessagesFilterPanel = ({
	messagesStore,
}: {
	messagesStore: EmbeddedMessagesStore;
}) => {
	const messagesDataStore = messagesStore.dataStore;
	const { filterStore } = messagesStore;

	const { config, filter } = useFilterConfig({
		filterInfo: filterStore.messagesFilterInfo,
		filter: filterStore.sseMessagesFilter,
		order: filterOrder,
	});

	const [showFilter, setShowFilter] = React.useState(false);
	const [currentStream, setCurrentStream] = React.useState('');
	const [streams, setStreams] = React.useState<Array<string>>([]);

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
	}, [filter, filterStore.params, streams]);

	const areSessionInvalid: boolean = streams.length === 0;

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(
		() => ({
			type: 'multiple-strings',
			id: 'messages-stream',
			values: streams,
			setValues: setStreams,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			validateBubbles: true,
			isInvalid: areSessionInvalid,
			required: true,
			wrapperClassName: 'messages-window-header__session-filter scrollable',
			hint: 'Session name',
		}),
		[streams, setStreams, currentStream, setCurrentStream],
	);

	const sseFiltersErrorConfig: ActionFilterConfig = React.useMemo(
		() => ({
			type: 'action',
			id: 'sse-filtler-error',
			message: 'Failed to load sse filters',
			actionButtonText: 'Try again',
			action: () => null,
			isLoading: false,
		}),
		[],
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
				isLoading={false}
				type='message'
			/>
			<MessagesFilterSessionFilter
				config={sessionFilterConfig}
				submitChanges={submitChanges}
				stopLoading={messagesDataStore.stopMessagesLoading}
				isLoading={messagesDataStore.isLoading}
			/>
		</>
	);
};

export default observer(EmbeddedMessagesFilterPanel);
