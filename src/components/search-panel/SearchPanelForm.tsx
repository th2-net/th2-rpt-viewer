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
import {
	DateTimeInputType,
	DateTimeMask,
	FitlerRowItem,
	TimeInputType,
} from 'models/filter/FilterInputs';
import { DATE_TIME_INPUT_MASK } from 'util/filterInputs';
import { SearchPanelFormState } from 'stores/SearchStore';
import FilterRow from '../filter/row';
import FilterDatetimeInput from '../filter/date-time-inputs/DateTimeInput';

type DateInputProps = {
	inputConfig: DateTimeInputType;
};

interface Props {
	formType: 'event' | 'message';
	form: SearchPanelFormState;
	updateForm: (patch: Partial<SearchPanelFormState>) => void;
	disabled: boolean;
	messageSessions: string[] | null;
}

const SearchPanelForm = (props: Props) => {
	const { disabled, updateForm, form, formType, messageSessions } = props;

	const [currentStream, setCurrentStream] = useState('');

	const toggleSearchDirection = () => {
		updateForm({
			searchDirection: form.searchDirection === 'next' ? 'previous' : 'next',
		});
	};

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
		{
			label: 'Search Direction',
			value: form.searchDirection === 'next',
			toggleValue: toggleSearchDirection,
			disabled,
			possibleValues: ['next', 'prev'],
			type: 'toggler',
			id: 'search-direction',
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

	const endTimestampInput: DateInputProps = {
		inputConfig: {
			id: 'endTimestamp',
			value: form.endTimestamp,
			disabled,
			setValue: getFormStateUpdater('endTimestamp'),
			type: TimeInputType.DATE_TIME,
			dateMask: DateTimeMask.DATE_TIME_MASK,
			placeholder: '',
			inputMask: DATE_TIME_INPUT_MASK,
		},
	};

	return (
		<>
			<div className='filter-row'>
				<div className='filter-row__label'>Start Timestamp</div>
				<FilterDatetimeInput {...startTimestampInput} />
			</div>
			<div className='filter-row'>
				<div className='filter-row__label'>Time Limit</div>
				<FilterDatetimeInput {...endTimestampInput} />
			</div>
			{config.map(rowConfig => (
				<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
			))}
		</>
	);
};

export default React.memo(SearchPanelForm);
