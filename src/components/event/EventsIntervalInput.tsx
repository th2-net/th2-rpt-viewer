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

import React, { useRef } from 'react';
import debounce from 'lodash.debounce';
import KeyCodes from '../../util/KeyCodes';
import { useEventsFilterStore } from '../../hooks/useEventsFilterStore';

export function EventsIntervalInput() {
	const eventsFilterStore = useEventsFilterStore();

	const inputRef = useRef<HTMLInputElement>();

	const submitIntervalDebounced = useRef(
		debounce((i: number) => {
			eventsFilterStore.setInterval(i);
		}, 500),
	);

	const [interval, setEventsInterval] = React.useState(() => eventsFilterStore.interval.toString());

	const onIntervalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const parsedInterval = parseInt(event.target.value) || '';
		setEventsInterval(parsedInterval.toString());

		if (parsedInterval) {
			submitIntervalDebounced.current(parsedInterval);
		} else {
			submitIntervalDebounced.current.cancel();
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.keyCode === KeyCodes.ENTER) {
			submitIntervalDebounced.current.cancel();
			const parsedInterval = parseInt(interval);
			if (parsedInterval) {
				eventsFilterStore.setInterval(parsedInterval);
				inputRef.current?.blur();
			}
		}
	};

	return (
		<div className='interval-input'>
			<label htmlFor='events-interval'>Interval (mins)</label>
			<input
				id='events-interval'
				type='text'
				value={interval}
				onChange={onIntervalChange}
				onKeyDown={handleKeyDown}
			/>
		</div>
	);
}
