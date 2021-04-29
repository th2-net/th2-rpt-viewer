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

import moment from 'moment';
import * as React from 'react';
import { useState, useRef } from 'react';
import api from '../../../api';
import { getTimestampAsNumber } from '../../../helpers/date';
import {
	createBemBlock,
	createBemElement,
	createStyleSelector,
} from '../../../helpers/styleCreators';
import { EventAction } from '../../../models/EventAction';
import { FilterRowEventResolverConfig } from '../../../models/filter/FilterInputs';

export default function StringFilterRow({ config }: { config: FilterRowEventResolverConfig }) {
	const [isInput, setIsInput] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [event, setEvent] = useState<EventAction | null>(null);
	const input = useRef(null);

	const inputClassName = createBemElement(
		'filter-row',
		'input',
		config.value.length ? 'non-empty' : '',
		isInput ? '' : 'hide',
	);

	const iconClassName = createStyleSelector(
		'filter-row__event-card-icon',
		isLoading ? 'loading' : '',
		event ? (event!.successful ? 'passed' : 'failed') : '',
		event === null && config.value !== '' ? 'not-found' : 'empty',
	);

	const wrapperClassName = createBemBlock('filter-row', config.wrapperClassName || null);
	const labelClassName = createStyleSelector('filter-row__label', config.labelClassName || null);

	const switchType = () => {
		setIsInput(!isInput);
		if (!isInput) {
			(input!.current as any).focus();
		} else {
			setEvent(null);
			fetchObjectById(config.value, new AbortController());
		}
	};

	const fetchObjectById = (id: string, abortController: AbortController) => {
		setIsLoading(true);
		function handleError(err: any) {
			if (err.name !== 'AbortError') {
				setIsLoading(false);
			}
		}
		Promise.all([
			api.events
				.getEvent(id, abortController.signal, { probe: true })
				.then((foundEvent: EventAction | null) => {
					setEvent(foundEvent);
					abortController.abort();
				})
				.catch(handleError),
		]).then(() => setIsLoading(false));
	};

	return (
		<div className={wrapperClassName}>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}

			{!isInput && (
				<div className='filter-row__event-card' onClick={() => switchType()}>
					<i className={iconClassName} />
					<div className='filter-row__event-card-title'>
						{event ? event?.eventName : config.value}
					</div>
					{event && (
						<div className='filter-row__event-card-info'>
							<div className='filter-row__event-card-id'>{event?.eventId}</div>
							<div className='filter-row__event-card-timestamp'>
								{moment(getTimestampAsNumber(event as EventAction))
									.utc()
									.format('DD.MM.YYYY HH:mm:ss.SSS')}
							</div>
						</div>
					)}
				</div>
			)}

			<input
				type='text'
				className={inputClassName}
				id={config.id}
				disabled={config.disabled}
				value={config.value}
				onChange={e => config.setValue(e.target.value)}
				onBlur={() => switchType()}
				ref={input}
			/>
		</div>
	);
}
