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
import { FilterRowMultipleStringsConfig } from '../../models/filter/FilterInputs';
import MessagesFilterSessionFilter from '../filter/MessageFilterSessionFilter';
import EmbeddedMessagesStore from './embedded-stores/EmbeddedMessagesStore';
import FilterButton from '../filter/FilterButton';

interface Props {
	submitChanges: () => void;
	showFilter: boolean;
	setShowFilter: (isShown: boolean) => void;
	messagesStore: EmbeddedMessagesStore;
	streams: string[];
	setStreams: (nextValues: string[]) => void;
}

const EmbeddedMessagesFilterPanel = (props: Props) => {
	const { submitChanges, showFilter, setShowFilter, messagesStore, streams, setStreams } = props;

	const messagesDataStore = messagesStore.dataStore;

	const [currentStream, setCurrentStream] = React.useState('');

	const areSessionInvalid: boolean = streams.length === 0;

	const sessionFilterConfig: FilterRowMultipleStringsConfig = React.useMemo(() => {
		return {
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
		};
	}, [streams, setStreams, currentStream, setCurrentStream]);

	return (
		<>
			<FilterButton
				isFilterApplied={messagesStore.filterStore.isMessagesFilterApplied}
				setShowFilter={setShowFilter}
				showFilter={showFilter}
				isLoading={false}
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
