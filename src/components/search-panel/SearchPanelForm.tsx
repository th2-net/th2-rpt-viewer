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
import {
	DateTimeInputType,
	DateTimeMask,
	FitlerRowItem,
	TimeInputType,
} from '../../models/filter/FilterInputs';
import FilterRow from '../filter/row';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';
import { SearchPanelFormState } from '../../stores/SearchStore';
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
import { useFiltersHistoryStore } from '../../hooks';

export type DateInputProps = {
	inputConfig: DateTimeInputType;
};

const SearchPanelForm = () => {
	const {
		isFormDisabled: disabled,
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
	} = useSearchStore();

	const [currentStream, setCurrentStream] = useState('');
	const { history } = useFiltersHistoryStore();

	const autocompletes = useMemo(() => history.filter(({ type }) => type === formType), [formType]);

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

	const eventsFormTypeConfig: FitlerRowItem = {
		label: 'Parent Event',
		value: form.parentEvent,
		disabled,
		setValue: getFormStateUpdater('parentEvent'),
		type: 'event-resolver',
		id: 'parent-event',
	};

	const messagesFormTypeConfig: FitlerRowItem = {
		type: 'multiple-strings',
		id: 'stream',
		label: 'Session',
		values: form.stream,
		disabled,
		setValues: getFormStateUpdater('stream'),
		currentValue: currentStream,
		setCurrentValue: setCurrentStream,
		autocompleteList: messageSessions,
		isInvalid: true,
		required: true,
	};

	const config: FitlerRowItem =
		formType === 'event' ? eventsFormTypeConfig : messagesFormTypeConfig;

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

	const {
		startTimestamp,
		completed,
		progress,
		timeLimits,
		timeIntervals,
		processedObjectCount,
	} = searchProgress;

	const searchDatetimeControlsConfig: SearchDatetimeControlsConfig = {
		isSearching,
		updateForm,
		startTimestampInput,
		disabled: disabled || isSearching,
		searchDirection: form.searchDirection,
		previousTimeLimit: {
			value:
				isSearching && !timeLimits.previous && startTimestamp
					? startTimestamp - progress.previous
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

	const searchSubmitConfig: SearchSubmitConfig = {
		isSearching,
		disabled:
			disabled || !form.searchDirection || (formType === 'message' && form.stream.length === 0),
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
				<FiltersHistory />
				<div className='filter-row'>
					<div className='filter-row__label'>Search for</div>
					<div className='search-type-config'>
						<SearchTypeSwitcher formType={formType} setFormType={setFormType} disabled={disabled} />
						<SearchResultCountLimit {...resultCountLimitConfig} />
					</div>
				</div>
				<FilterRow rowConfig={config} />
			</div>
			<div className='filters'>
				{filters && filters.info.length > 0 && (
					<SearchPanelFilters {...(filters as any)} type={formType} autocompletes={autocompletes} />
				)}
			</div>
		</div>
	);
};

export default observer(SearchPanelForm);
