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
import { useState, useRef, useEffect } from 'react';
import api from '../../../api';
import { getTimestampAsNumber } from '../../../helpers/date';
import { getEventStatus } from '../../../helpers/event';
import { createBemElement, createStyleSelector } from '../../../helpers/styleCreators';
import { useDebouncedCallback } from '../../../hooks';
import { EventAction } from '../../../models/EventAction';
import { FilterRowEventResolverConfig } from '../../../models/filter/FilterInputs';
import AutocompleteInput from '../../util/AutocompleteInput';

export default function EventResolverRow({ config }: { config: FilterRowEventResolverConfig }) {
	const [isInput, setIsInput] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [event, setEvent] = useState<EventAction | null>(null);
	const input = useRef<HTMLInputElement>(null);

	const [autocompleteAnchor, setAutocompleteAnchor] = React.useState<HTMLDivElement>();

	React.useLayoutEffect(() => {
		setAutocompleteAnchor(input.current || undefined);
	}, [setAutocompleteAnchor]);

	const inputWrapperClassName = createBemElement(
		'filter-row',
		'wrapper',
		!isInput ? 'hidden' : null,
	);

	const inputClassName = createBemElement(
		'filter-row',
		'input',
		config.value.length ? 'non-empty' : '',
		isInput ? '' : 'hide',
	);

	const searchStatusIconClassname = createStyleSelector(
		'filter-row__search-status',
		isLoading ? 'loading' : null,
		isError && !isLoading && config.value !== '' ? 'not-found' : '',
	);

	const iconClassName = createStyleSelector(
		'filter-row__event-card-icon',
		event ? getEventStatus(event).toLowerCase() : 'hide',
	);

	const clearClassName = createStyleSelector('filter-row__clear', config.value ? 'show' : null);

	const wrapperClassName = createStyleSelector('filter-row', 'event-resolver');
	const labelClassName = createStyleSelector('filter-row__label', config.labelClassName || null);
	const eventCardTitleClassName = createStyleSelector(
		'filter-row__event-card-title',
		event?.eventName || config.value ? 'non-empty' : null,
	);

	useEffect(() => {
		const ac = new AbortController();
		setEvent(null);
		setIsError(false);

		if (config.value) {
			setIsLoading(true);
			fetchObjectById(config.value, ac);
		}
		return () => {
			ac.abort();
		};
	}, [config.value]);

	const switchType = () => {
		if (isInput && event) {
			setIsInput(false);
		} else if (!isInput && input.current) {
			setIsInput(true);
			input.current.focus();
		}
	};

	const fetchObjectById = useDebouncedCallback(
		async (id: string, abortController: AbortController) => {
			try {
				const foundEvent = await api.events.getEvent(id, abortController.signal, { probe: true });
				setEvent(foundEvent);
				setIsInput(!foundEvent);
				setIsError(!foundEvent);
				setIsLoading(false);
			} catch (error) {
				setIsLoading(false);
				setEvent(null);
				setIsInput(true);
				setIsError(true);
			}
		},
		400,
	);

	const onAutocompleteValueSelect = React.useCallback((nextValue: string) => {
		config.setValue(nextValue);
		config.onAutocompleteSelect?.();
	}, []);

	return (
		<div className={wrapperClassName}>
			{config.label && (
				<label className={labelClassName} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			{!isInput && (
				<div className='filter-row__event-card' onClick={switchType}>
					<i className={iconClassName} />
					<div className={eventCardTitleClassName}>
						{event ? event?.eventName : config.value || config.placeholder}
					</div>
					{event && (
						<div className='filter-row__event-card-timestamp'>
							{moment.utc(getTimestampAsNumber(event)).format('DD.MM.YYYY HH:mm:ss.SSS')}
						</div>
					)}
				</div>
			)}
			{(isLoading || isError) && <div className={searchStatusIconClassname} />}
			<AutocompleteInput
				value={config.value}
				setValue={config.setValue}
				onSubmit={onAutocompleteValueSelect}
				ref={input}
				wrapperClassName={inputWrapperClassName}
				className={inputClassName}
				id={config.id}
				placeholder={config.placeholder}
				disabled={config.disabled}
				autoComplete='off'
				autoCompleteList={config.autocompleteList}
				onBlur={() => switchType()}
				anchor={autocompleteAnchor}
				inputStyle={{
					boxSizing: 'border-box',
					flexGrow: 1,
					width: '100%',
				}}
				alwaysShowAutocomplete
			/>
			<button
				className={clearClassName}
				onClick={() => {
					config.setValue('');
					input.current?.focus();
				}}
			/>
		</div>
	);
}
