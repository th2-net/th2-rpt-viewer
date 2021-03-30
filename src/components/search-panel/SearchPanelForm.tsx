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

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AnimatePresence, motion } from 'framer-motion';
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
import SearchDatetimeControl from './search-form/SearchDatetimeControl';
import FilterDatetimeInput from '../filter/date-time-inputs/DateTimeInput';
import SearchProgressBar, { SearchProgressBarConfig } from './search-form/SearchProgressBar';
import { SearchDirection } from '../../models/search/SearchDirection';

export type DateInputProps = {
	inputConfig: DateTimeInputType;
};

type Props = {
	collapsed: boolean;
};

const SearchPanelForm = ({ collapsed }: Props) => {
	const {
		isFormDisabled: disabled,
		updateForm,
		searchForm: form,
		formType,
		messageSessions,
		filters,
		startSearch,
		stopSearch,
		setFormType,
		isSearching,
		searchProgress,
	} = useSearchStore();

	const [currentStream, setCurrentStream] = useState('');

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

	const commonFormConfig: FitlerRowItem[] = [
		{
			label: 'Result Count Limit',
			value: !form.resultCountLimit ? '' : form.resultCountLimit.toString(),
			setValue: updateCountLimit,
			type: 'string',
			disabled,
			id: 'result-count-limit',
		},
	];

	const eventsFormTypeConfig: FitlerRowItem = {
		label: 'Parent Event',
		value: form.parentEvent,
		disabled,
		setValue: getFormStateUpdater('parentEvent'),
		type: 'string',
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
	};

	const config: FitlerRowItem[] =
		formType === 'event'
			? [...commonFormConfig, eventsFormTypeConfig]
			: [...commonFormConfig, messagesFormTypeConfig];

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

	const timeLimitPrevTimestampInput: DateInputProps = {
		inputConfig: {
			id: 'timeLimitPrevious',
			value: form.timeLimits.previous,
			disabled: disabled || form.searchDirection === SearchDirection.Next,
			setValue: nextValue =>
				updateForm({ timeLimits: { ...form.timeLimits, previous: nextValue } }),
			type: TimeInputType.DATE_TIME,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: '',
			inputMask: DATE_TIME_INPUT_MASK,
		},
	};

	const timeLimitNextTimestampInput: DateInputProps = {
		inputConfig: {
			id: 'timeLimitNext',
			value: form.timeLimits.next,
			disabled: disabled || form.searchDirection === SearchDirection.Previous,
			setValue: nextValue => updateForm({ timeLimits: { ...form.timeLimits, next: nextValue } }),
			type: TimeInputType.DATE_TIME,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: '',
			inputMask: DATE_TIME_INPUT_MASK,
		},
	};

	const { completed, progress, timeLimits, timeIntervals } = searchProgress;

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

	return (
		<div className='search-panel__search-form search-form'>
			<SearchDatetimeControl
				form={form}
				updateForm={updateForm}
				startTimestampInput={startTimestampInput}
			/>
			<SearchProgressBar {...progressBarConfig} />
			<div className='search-time-limit-controls'>
				<div className='search-progress__time-limit-input previous'>
					<FilterDatetimeInput {...timeLimitPrevTimestampInput} />
				</div>
				<div className='search-time-limit-controls__submit'>
					<button
						disabled={disabled}
						onClick={isSearching ? () => stopSearch() : () => startSearch()}>
						{isSearching ? 'Stop' : 'Start'}
					</button>
				</div>
				<div className='search-progress__time-limit-input next'>
					<FilterDatetimeInput {...timeLimitNextTimestampInput} />
				</div>
			</div>
			<AnimatePresence>
				{!collapsed && (
					<motion.div
						initial='collapsed'
						animate='open'
						exit='collapsed'
						variants={{
							open: { opacity: 1, height: 'auto' },
							collapsed: { opacity: 0, height: 0 },
						}}
						transition={{ duration: 0.3 }}>
						<div className='search-panel__fields'>
							<div className='filter-row'>
								<div className='filter-row__label'>Search for</div>
								<SearchTypeSwitcher formType={formType} setFormType={setFormType} />
							</div>
							{config.map(rowConfig => (
								<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
							))}
						</div>
						<div className='filters'>
							{filters && filters.info.length > 0 && <SearchPanelFilters {...filters} />}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default observer(SearchPanelForm);
