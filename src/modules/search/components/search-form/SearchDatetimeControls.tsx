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

import { createBemElement } from 'helpers/styleCreators';
import { SearchDirection } from 'models/SearchDirection';
import FilterDatetimeInput from 'components/filter/date-time-inputs/DateTimeInput';
import { SearchPanelFormState } from '../../stores/SearchStore';
import { DateInputProps } from '../SearchPanelForm';
import TimeLimitControl from './TimeLimitControl';

export type SearchDatetimeControlsConfig = {
	isSearching: boolean;
	updateForm: (stateUpdate: Partial<SearchPanelFormState>) => void;
	startTimestampInput: DateInputProps;
	disabled: boolean;
	previousTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	nextTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	searchDirection: SearchDirection | null;
};

const SearchDatetimeControls = ({
	isSearching,
	searchDirection,
	updateForm,
	startTimestampInput,
	disabled,
	previousTimeLimit,
	nextTimeLimit,
}: SearchDatetimeControlsConfig) => {
	const directionClicked = (direction: SearchDirection) => {
		if (disabled) return;

		if (searchDirection === direction) {
			updateForm({
				searchDirection: null,
			});
		} else if (searchDirection === SearchDirection.Both) {
			updateForm({
				searchDirection:
					direction === SearchDirection.Next ? SearchDirection.Previous : SearchDirection.Next,
			});
		} else {
			updateForm({
				searchDirection: !searchDirection ? direction : SearchDirection.Both,
			});
		}
	};

	const prevButtonClassName = createBemElement(
		'datetime-control',
		'direction-button',
		'direction-button',
		'prev',
		searchDirection === SearchDirection.Previous || searchDirection === SearchDirection.Both
			? 'active'
			: null,
		disabled ? 'disabled' : null,
	);

	const prevIconClassName = createBemElement(
		'direction-button',
		'icon',
		'prev',
		searchDirection === SearchDirection.Previous || searchDirection === SearchDirection.Both
			? 'active'
			: null,
	);

	const nextButtonClassName = createBemElement(
		'datetime-control',
		'direction-button',
		'direction-button',
		'next',
		searchDirection === SearchDirection.Next || searchDirection === SearchDirection.Both
			? 'active'
			: null,
		disabled ? 'disabled' : null,
	);

	const nextIconClassName = createBemElement(
		'direction-button',
		'icon',
		'next',
		searchDirection === SearchDirection.Next || searchDirection === SearchDirection.Both
			? 'active'
			: null,
	);

	const isLeftTimeLimitInvalid =
		previousTimeLimit.value !== null &&
		startTimestampInput.inputConfig.value !== null &&
		previousTimeLimit.value > startTimestampInput.inputConfig.value;

	const isRightTimeControlInvalid =
		nextTimeLimit.value !== null &&
		startTimestampInput.inputConfig.value !== null &&
		nextTimeLimit.value < startTimestampInput.inputConfig.value;

	return (
		<div className='search-form__search-datetime-controls search-datetime-controls'>
			<div className='search-datetime-controls__previous'>
				<TimeLimitControl
					value={previousTimeLimit.value}
					setValue={previousTimeLimit.setValue}
					disabled={disabled || !searchDirection || searchDirection === SearchDirection.Next}
					readonly={isSearching}
					hidden={!searchDirection || searchDirection === SearchDirection.Next}
					showError={isLeftTimeLimitInvalid}
					errorTextRows={['Should be less than start timestamp']}
					errorPosition='left'
				/>
			</div>
			<div className='search-datetime-controls__start'>
				<button
					className={prevButtonClassName}
					onClick={() => directionClicked(SearchDirection.Previous)}>
					<i className={prevIconClassName} />
				</button>
				<div className='search-datetime-controls__start-input'>
					<FilterDatetimeInput {...startTimestampInput} />
				</div>
				<button
					className={nextButtonClassName}
					onClick={() => directionClicked(SearchDirection.Next)}>
					<i className={nextIconClassName} />
				</button>
			</div>
			<div className='search-datetime-controls__next'>
				<TimeLimitControl
					value={nextTimeLimit.value}
					setValue={nextTimeLimit.setValue}
					disabled={disabled || !searchDirection || searchDirection === SearchDirection.Previous}
					readonly={isSearching}
					hidden={!searchDirection || searchDirection === SearchDirection.Previous}
					showError={isRightTimeControlInvalid}
					errorTextRows={['Should be greater than start timestamp']}
					errorPosition='right'
				/>
			</div>
		</div>
	);
};

export default SearchDatetimeControls;
