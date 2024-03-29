/** ****************************************************************************
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

import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import {
	DateTimeInputType,
	DateTimeMask,
	FitlerRowItem,
	TimeInputType,
} from '../../models/filter/FilterInputs';
import FilterRow from '../filter/row';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';
import { useSearchStore } from '../../hooks/useSearchStore';
import SearchPanelFilters from './SearchPanelFilters';
import SearchTypeSwitcher from './search-form/SearchTypeSwitcher';
import SearchDatetimeControls, {
	SearchDatetimeControlsConfig,
} from './search-form/SearchDatetimeControls';
import SearchProgressBar, { SearchProgressBarConfig } from './search-form/SearchProgressBar';
import SearchSubmit, { SearchSubmitConfig } from './search-form/SearchSubmit';
import SearchResultCountLimit, {
	ResultCountLimitConfig,
} from './search-form/SearchResultCountLimit';
import { SearchDirection } from '../../models/search/SearchDirection';
import FiltersHistory from '../filters-history/FiltersHistory';
import { useFiltersHistoryStore, useSessionsStore } from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';
import InfinityLimit, { InfinityLimitConfig } from './search-form/InfinityLimit';
import { SearchPanelFormState } from '../../stores/SearchStore';

export type DateInputProps = {
	inputConfig: DateTimeInputType;
};

const SearchPanelForm = () => {
	const {
		isHistorySearch,
		updateForm,
		searchForm: form,
		formType,
		messageSessions,
		filters,
		startSearch,
		pauseSearch,
		setFormType,
		isSearching,
		searchProgress,
		isPaused,
		clearFilters,
	} = useSearchStore();

	const disabled = isHistorySearch || isSearching;

	const [currentStream, setCurrentStream] = useState('');
	const sessionsStore = useSessionsStore();

	const { eventsHistory, messagesHistory } = useFiltersHistoryStore();

	const sessionsAutocomplete: string[] = React.useMemo(
		() => [
			...sessionsStore.sessions.map(s => s.session),
			...messageSessions.filter(
				session => sessionsStore.sessions.findIndex(s => s.session === session) === -1,
			),
		],
		[messageSessions, sessionsStore.sessions],
	);

	const areSessionInvalid: boolean = React.useMemo(
		() =>
			form.stream.length === 0 ||
			form.stream.some(stream => !messageSessions.includes(stream.trim())),
		[form.stream, messageSessions],
	);

	const autocompletes = useMemo(
		() => (formType === 'event' ? eventsHistory : messagesHistory),
		[formType, eventsHistory, messagesHistory],
	);

	function getFormStateUpdater<T extends keyof SearchPanelFormState>(name: T) {
		return function formStateUpdater<K extends SearchPanelFormState[T]>(value: K) {
			updateForm({ [name]: value });
		};
	}

	function updateCountLimit(value: string) {
		if (value === '' || /^\d+$/.test(value)) {
			updateForm({ resultCountLimit: value === '' ? undefined : Number(value) });
		}
	}

	const resultCountLimitConfig: ResultCountLimitConfig = {
		value: !form.resultCountLimit ? '' : form.resultCountLimit.toString(),
		setValue: updateCountLimit,
		disabled,
	};

	function updateInfinityLimit(value: string) {
		if (value === '' || /^\d+$/.test(value)) {
			updateForm({ infinityLimit: value === '' ? undefined : Number(value) });
		}
	}

	const infinityLimitConfig: InfinityLimitConfig = {
		value: !form.infinityLimit ? '' : form.infinityLimit.toString(),
		setValue: updateInfinityLimit,
		disabled,
	};

	const sessionsConfig: FitlerRowItem = {
		type: 'multiple-strings',
		id: 'stream',
		label: 'Session',
		values: form.stream,
		disabled,
		setValues: getFormStateUpdater('stream'),
		currentValue: currentStream,
		setCurrentValue: setCurrentStream,
		autocompleteList: sessionsAutocomplete,
		isInvalid: areSessionInvalid,
		required: true,
		validateBubbles: true,
	};

	const startTimestampInput: DateInputProps = {
		inputConfig: {
			id: 'startTimestamp',
			value: form.startTimestamp,
			disabled,
			setValue: getFormStateUpdater('startTimestamp'),
			type: TimeInputType.DATE_TIME,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: '',
			inputMask: DATE_TIME_INPUT_MASK,
		},
	};

	const { startTimestamp, completed, progress, timeLimits, timeIntervals, processedObjectCount } =
		searchProgress;

	const searchDatetimeControlsConfig: SearchDatetimeControlsConfig = {
		infinityLimit: {
			next: moment.utc(form.startTimestamp).add(form.infinityLimit, 'days').valueOf(),
			prev: moment.utc(form.startTimestamp).subtract(form.infinityLimit, 'days').valueOf(),
		},
		isSearching,
		updateForm,
		startTimestampInput,
		disabled: disabled || isSearching,
		searchDirection: form.searchDirection,
		previousTimeLimit: {
			value:
				isSearching && !timeLimits.previous && startTimestamp
					? startTimestamp - Math.abs(progress.previous)
					: timeLimits.previous,
			setValue: nextValue =>
				updateForm({ timeLimits: { ...form.timeLimits, previous: nextValue } }),
		},
		nextTimeLimit: {
			value:
				isSearching && !timeLimits.next && startTimestamp
					? startTimestamp + progress.next
					: timeLimits.next,
			setValue: nextValue => updateForm({ timeLimits: { ...timeLimits, next: nextValue } }),
		},
	};

	const progressBarConfig: SearchProgressBarConfig = {
		isSearching,
		searchDirection: form.searchDirection,
		leftProgress: {
			completed: completed.previous,
			isInfinite: !timeLimits.previous,
			progress: timeIntervals.previous ? (progress.previous / timeIntervals.previous) * 100 : 0,
		},
		rightProgress: {
			completed: completed.next,
			isInfinite: !timeLimits.next,
			progress: timeIntervals.next ? (progress.next / timeIntervals.next) * 100 : 0,
		},
	};

	let commonProgress: number | null = null;

	if (
		form.searchDirection === SearchDirection.Both &&
		!progressBarConfig.leftProgress.isInfinite &&
		!progressBarConfig.rightProgress.isInfinite
	) {
		commonProgress = Math.floor(
			(progressBarConfig.leftProgress.progress + progressBarConfig.rightProgress.progress) / 2,
		);
	} else if (
		form.searchDirection === SearchDirection.Previous &&
		!progressBarConfig.leftProgress.isInfinite
	) {
		commonProgress = Math.floor(progressBarConfig.leftProgress.progress);
	} else if (
		form.searchDirection === SearchDirection.Next &&
		!progressBarConfig.rightProgress.isInfinite
	) {
		commonProgress = Math.floor(progressBarConfig.rightProgress.progress);
	}

	const wrongLimits = React.useMemo(() => {
		if (!form.startTimestamp) return false;
		const prevLimitCheck =
			form.timeLimits.previous &&
			(form.searchDirection === SearchDirection.Both ||
				form.searchDirection === SearchDirection.Previous)
				? form.timeLimits.previous.valueOf() < form.startTimestamp.valueOf()
				: true;
		const nextLimitCheck =
			form.timeLimits.next &&
			(form.searchDirection === SearchDirection.Both ||
				form.searchDirection === SearchDirection.Next)
				? form.timeLimits.next.valueOf() > form.startTimestamp.valueOf()
				: true;
		return prevLimitCheck && nextLimitCheck;
	}, [form.startTimestamp, form.timeLimits, form.searchDirection]);

	const searchSubmitConfig: SearchSubmitConfig = {
		isSearching,
		disabled:
			!wrongLimits ||
			isHistorySearch ||
			!form.searchDirection ||
			(formType === 'message' && form.stream.length === 0),
		progress: commonProgress,
		processedObjectCount,
		isPaused,
		startSearch,
		pauseSearch,
	};

	return (
		<div className='search-panel__search-form search-form'>
			<SearchDatetimeControls {...searchDatetimeControlsConfig} />
			<SearchProgressBar {...progressBarConfig} />
			<SearchSubmit {...searchSubmitConfig} />
			<div className='search-panel__fields'>
				<div className='filter-row'>
					<div className='search-type-config'>
						<FiltersHistory disabled={disabled} />
						<InfinityLimit {...infinityLimitConfig} />
					</div>
				</div>
				<div className='filter-row'>
					<div className='filter-row__label'>Search for</div>
					<div className='search-type-config'>
						<SearchTypeSwitcher formType={formType} setFormType={setFormType} disabled={disabled} />
						<SearchResultCountLimit {...resultCountLimitConfig} />
					</div>
				</div>
				{formType === 'message' ? <FilterRow rowConfig={sessionsConfig} /> : null}
			</div>
			<div className='filters'>
				{filters && filters.info.length > 0 && (
					<SearchPanelFilters {...(filters as any)} type={formType} autocompletes={autocompletes} />
				)}
			</div>
			{!disabled && (
				<div className='search-panel__footer'>
					<button
						className={createBemElement(
							'search-panel',
							'clear-btn',
							isSearching ? 'disabled' : null,
						)}
						onClick={clearFilters}
						disabled={isSearching}>
						<i className='search-panel__clear-icon' />
						Clear All
					</button>
				</div>
			)}
		</div>
	);
};

export default observer(SearchPanelForm);
