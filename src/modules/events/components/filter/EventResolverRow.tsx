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

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { formatTime } from 'helpers/date';
import AutocompleteInput from 'components/util/AutocompleteInput';
import { getEventStatus, isEventId } from 'helpers/event';
import { createBemElement, createStyleSelector } from 'helpers/styleCreators';
import { FilterRowEventResolverConfig } from 'models/filter/FilterInputs';
import { useEvent } from '../../hooks/useEvent';
import { useEventsSearch } from '../../hooks/useEventSearch';

export default function EventResolverRow({ config }: { config: FilterRowEventResolverConfig }) {
	const [isEventPlaceholder, showEventPlaceholder] = useState(true);

	const input = useRef<HTMLInputElement>(null);

	const isId = isEventId(config.value);

	const { data: events, isLoading: isLoadingAutocompleteList } = useEventsSearch(
		!isId ? config.value.trim() : '',
	);

	const autocomplete = useMemo(() => events.map(e => e.eventId), [events]);

	const {
		event,
		isError,
		isLoading: isLoadingEvent,
	} = useEvent(isId ? config.value.trim() : '', { debounceMs: 400 });

	useEffect(() => {
		showEventPlaceholder(Boolean(event));
	}, [event]);

	const showInput = () => showEventPlaceholder(false);

	const showEventCard = () => {
		if (event) {
			showEventPlaceholder(true);
		}
	};

	const onAutocompleteValueSelect = useCallback((nextValue: string) => {
		config.setValue(nextValue);
	}, []);

	const onClearParentEvent = () => {
		config.setValue('');
		input.current?.focus();
	};

	const isLoading = isLoadingAutocompleteList || isLoadingEvent;

	const inputWrapperClassName = createBemElement('filter-row', 'wrapper');

	const inputClassName = createBemElement(
		'filter-row',
		'input',
		config.value.length ? 'non-empty' : '',
		isEventPlaceholder ? 'hide' : '',
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

	return (
		<div className={wrapperClassName}>
			{config.label && <label className={labelClassName}>{config.label}</label>}
			{isEventPlaceholder && (
				<div className='filter-row__event-card' onClick={showInput}>
					<i className={iconClassName} />
					<div className={eventCardTitleClassName}>
						{event ? event?.eventName : config.value || config.placeholder}
					</div>
					{event && (
						<div className='filter-row__event-card-timestamp'>
							{formatTime(event.startTimestamp)}
						</div>
					)}
				</div>
			)}
			<div className={searchStatusIconClassname} />
			{!isEventPlaceholder && (
				<AutocompleteInput
					value={config.value}
					setValue={config.setValue}
					onSubmit={onAutocompleteValueSelect}
					ref={input}
					wrapperClassName={inputWrapperClassName}
					className={inputClassName}
					placeholder={config.placeholder}
					disabled={config.disabled}
					autoComplete='off'
					autoFocus
					autoCompleteList={autocomplete}
					onBlur={showEventCard}
					anchor={input.current || undefined}
					inputStyle={{
						boxSizing: 'border-box',
						flexGrow: 1,
						width: '100%',
					}}
					alwaysShowAutocomplete
				/>
			)}
			<button className={clearClassName} onClick={onClearParentEvent} />
		</div>
	);
}
