/** *****************************************************************************
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
 ***************************************************************************** */

import React from 'react';
import { observer } from 'mobx-react-lite';
import FilterPanel from './FilterPanel';
import { useFirstEventWindowStore } from '../../hooks/useFirstEventWindowStore';

const ONE_HOUR = 60 * 60 * 1000;

const MessagesFilterPanel = () => {
	const { filterStore } = useFirstEventWindowStore();

	const [showFilter, setShowFilter] = React.useState(false);
	const [timestampFrom, setTimestampFrom] = React.useState(filterStore.messagesFilter.timestampFrom);
	const [timestampTo, setTimestampTo] = React.useState(filterStore.messagesFilter.timestampTo);
	const [stream, setStream] = React.useState(filterStore.messagesFilter.stream);
	const [messageType, setMessageType] = React.useState(filterStore.messagesFilter.messageType);

	React.useEffect(() => {
		setTimestampFrom(filterStore.messagesFilter.timestampFrom);
		setTimestampTo(filterStore.messagesFilter.timestampTo);
		setStream(filterStore.messagesFilter.stream);
		setMessageType(filterStore.messagesFilter.messageType);
	}, [showFilter, filterStore.messagesFilter]);

	const formatTimestampValue = (timestamp: number) => {
		const date = new Date(timestamp);

		return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
	};

	const submitChanges = () => {
		if (timestampFrom > timestampTo) {
			// eslint-disable-next-line no-alert
			window.alert('Invalid messagesFilter filter');
			return;
		}

		filterStore.updateFilter({
			timestampFrom,
			timestampTo,
			stream,
			messageType,
		});
	};

	const clearAllFilters = () => {
		setMessageType(null);
		setStream(null);
		setTimestampFrom(new Date(new Date().getTime() - ONE_HOUR).getTime());
		setTimestampTo(new Date().getTime());
		submitChanges();
	};

	return (
		<FilterPanel
			isFilterApplied={false}
			setShowFilter={setShowFilter}
			showFilter={showFilter}
			onSubmit={submitChanges}
			onClearAll={clearAllFilters}>
			<div className='filter-row'>
				<label htmlFor='messages-from'>Messages from</label>
				<input id='messages-from'
					className='filter-row__datetime-input'
					type='datetime-local'
					value={formatTimestampValue(timestampFrom)}
					onChange={e => setTimestampFrom(new Date(e.target.value).getTime())}/>
				<label htmlFor='messages-to'> to </label>
				<input id='messages-to'
					className='filter-row__datetime-input'
					type='datetime-local'
					value={formatTimestampValue(timestampTo)}
					onChange={e => setTimestampTo(new Date(e.target.value).getTime())}/>
			</div>
			<div className="filter-row">
				<label className="filter-row__label" htmlFor="stream">
					Stream name
				</label>
				<input
					type="text"
					className="filter-row__input"
					id="stream"
					value={stream || ''}
					onChange={e => setStream(e.target.value)}/>
			</div>
			<div className="filter-row">
				<label className="filter-row__label" htmlFor="type">
					Message type
				</label>
				<input
					type="text"
					className="filter-row__input"
					id="type"
					value={messageType || ''}
					onChange={e => setMessageType(e.target.value)}/>
			</div>
		</FilterPanel>
	);
};

export default observer(MessagesFilterPanel);
