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
import React, { useMemo, useState } from 'react';
import {
	DateTimeInputType,
	DateTimeMask,
	FilterRowConfig,
	TimeInputType,
} from '../../models/filter/FilterInputs';
import { SearchPanelState } from './SearchPanel';
import FilterRow from '../filter/row';
import FilterDatetimeInput from '../filter/date-time-inputs/DateTimeInput';
import { DATE_TIME_INPUT_MASK } from '../../util/filterInputs';

interface SearchPanelFormProps {
	formType: 'event' | 'message';
	state: SearchPanelState;
	setState: (
		patch: Partial<SearchPanelState> | ((prevState: SearchPanelState) => Partial<SearchPanelState>),
	) => void;
}

type DateInputProps = {
	inputConfig: DateTimeInputType;
};

const SearchPanelForm = (props: SearchPanelFormProps) => {
	const { formType, state, setState } = props;
	const [currentStream, setCurrentStream] = useState('');

	const toggleSearchDirection = () => {
		setState(currentState => ({
			...currentState,
			searchDirection: currentState.searchDirection === 'next' ? 'previous' : 'next',
		}));
	};

	function getFormStateUpdater<T extends keyof SearchPanelState>(name: T) {
		return function formStateUpdater<K extends SearchPanelState[T]>(value: K) {
			setState(currentState => ({ ...currentState, [name]: value }));
		};
	}

	const commonFormConfig: FilterRowConfig[] = [
		{
			label: 'Result Count Limit',
			value: state.resultCountLimit,
			setValue: getFormStateUpdater('resultCountLimit'),
			type: 'string',
			id: 'result-count-limit',
		},
		{
			label: 'Time Limit',
			value: state.timeLimit,
			setValue: getFormStateUpdater('timeLimit'),
			type: 'string',
			id: 'time-limit',
		},
		{
			label: 'Search Direction',
			value: state.searchDirection === 'next',
			toggleValue: toggleSearchDirection,
			disabled: false,
			possibleValues: ['next', 'prev'],
			type: 'toggler',
			id: 'search-direction',
		},
	];

	const eventsFormTypeConfig: FilterRowConfig = {
		label: 'Parent Event',
		value: state.parentEvent,
		setValue: getFormStateUpdater('parentEvent'),
		type: 'string',
		id: 'parent-event',
	};

	const messagesFormTypeConfig: FilterRowConfig = {
		type: 'multiple-strings',
		id: 'stream',
		label: 'Stream',
		values: state.stream,
		setValues: getFormStateUpdater('stream'),
		currentValue: currentStream,
		setCurrentValue: setCurrentStream,
		autocompleteList: null,
	};

	const config: FilterRowConfig[] = useMemo(() => {
		if (formType === 'event') {
			return [...commonFormConfig, eventsFormTypeConfig];
		}
		return [...commonFormConfig, messagesFormTypeConfig];
	}, [commonFormConfig, formType]);

	const dateInput: DateInputProps = {
		inputConfig: {
			id: 'startTimestamp',
			value: state.startTimestamp,
			setValue: getFormStateUpdater('startTimestamp'),
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
				<FilterDatetimeInput {...dateInput} />
			</div>
			{config.map(rowConfig => (
				<FilterRow rowConfig={rowConfig} key={rowConfig.id} />
			))}
		</>
	);
};

export default SearchPanelForm;
