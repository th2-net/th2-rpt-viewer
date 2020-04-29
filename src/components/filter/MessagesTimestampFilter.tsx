/*******************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
 ******************************************************************************/

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';

function MessagesTimestampFilter() {
	const { filterStore } = useStores();

	const [fromTimestamp, setFromTimestamp] = React.useState(filterStore.messagesTimestampFrom);
	const [toTimestamp, setToTimestamp] = React.useState(filterStore.messagesTimestampTo);

	React.useEffect(() => {
		setFromTimestamp(filterStore.messagesTimestampFrom);
	}, [filterStore.messagesTimestampFrom]);

	React.useEffect(() => {
		setToTimestamp(filterStore.messagesTimestampTo);
	}, [filterStore.messagesTimestampTo]);

	const formatTimestampValue = (timestamp: number) => {
		const date = new Date(timestamp);

		return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
	};

	const submitChanges = () => {
		if (fromTimestamp > toTimestamp) {
			window.alert('Invalid messages filter');
			return;
		}

		filterStore.setMessagesFromTimestamp(fromTimestamp);
		filterStore.setMessagesToTimestamp(toTimestamp);
	};

	return (
		<div className='filter-row' style={{ paddingLeft: 16 }}>
			<label htmlFor='messages-from'>Messages from</label>
			<input id='messages-from'
				   className='filter-row__datetime-input'
				   type='datetime-local'
				   value={formatTimestampValue(fromTimestamp)}
				   onChange={e => setFromTimestamp(new Date(e.target.value).getTime())}/>
			<label htmlFor='messages-to'> to </label>
			<input id='messages-to'
				   className='filter-row__datetime-input'
				   type='datetime-local'
				   value={formatTimestampValue(toTimestamp)}
				   onChange={e => setToTimestamp(new Date(e.target.value).getTime())}/>
			<div className='filter-row__submit-btn'
				 onClick={submitChanges}>
				Submit
			</div>
		</div>
	);
}

export default observer(MessagesTimestampFilter);
