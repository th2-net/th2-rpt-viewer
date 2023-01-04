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

import { useMemo, useEffect, useState } from 'react';
import { FilterRowMultipleStringsConfig } from 'models/filter/FilterInputs';
import FilterRow from 'components/filter/row/FilterRow';
import { Button } from 'components/buttons/Button';
import { useSessionAutocomplete } from '../../hooks/useMessagesAutocomplete';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useFilterStore } from '../../hooks/useFilterStore';

type MessagesFilterSessionFilterProps = {
	submitChanges: () => void;
	stopLoading: () => void;
	isLoading: boolean;
	sessions: string[];
	setSessions: (sessions: string[]) => void;
};

const MessagesFilterSessionFilter = ({
	submitChanges,
	stopLoading,
	isLoading,
	sessions,
	setSessions,
}: MessagesFilterSessionFilterProps) => {
	const messagesStore = useMessagesStore();
	const filterStore = useFilterStore();
	const sessionsAutocomplete = useSessionAutocomplete();

	const [currentStream, setCurrentStream] = useState('');

	useEffect(() => {
		setSessions(filterStore.params.streams);
	}, [filterStore.params.streams]);

	const areSessionInvalid: boolean = useMemo(
		() =>
			sessions.length === 0 ||
			sessions.some(stream => !messagesStore.messageSessions.includes(stream.trim())),
		[sessions, messagesStore.messageSessions],
	);

	const config: FilterRowMultipleStringsConfig = useMemo(
		() => ({
			type: 'multiple-strings',
			id: 'messages-stream',
			values: sessions,
			setValues: setSessions,
			currentValue: currentStream,
			setCurrentValue: setCurrentStream,
			autocompleteList: sessionsAutocomplete,
			validateBubbles: true,
			isInvalid: areSessionInvalid,
			required: true,
			wrapperClassName: 'messages-window-header__session-filter scrollable',
			hint: 'Session name',
		}),
		[sessions, setSessions, currentStream, setCurrentStream, sessionsAutocomplete],
	);
	return (
		<div className='sessions-row'>
			<FilterRow rowConfig={config} />
			<Button variant='contained' onClick={isLoading ? stopLoading : submitChanges}>
				<span>{isLoading ? 'Stop' : 'Search'}</span>
			</Button>
		</div>
	);
};

export default MessagesFilterSessionFilter;
