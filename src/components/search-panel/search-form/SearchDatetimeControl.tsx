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

import React from 'react';
import { createBemElement } from '../../../helpers/styleCreators';
import { SearchDirection } from '../../../models/search/SearchDirection';
import { SearchPanelFormState } from '../../../stores/SearchStore';
import FilterDatetimeInput from '../../filter/date-time-inputs/DateTimeInput';
import { DateInputProps } from '../SearchPanelForm';

type Props = {
	form: SearchPanelFormState;
	updateForm: (stateUpdate: Partial<SearchPanelFormState>) => void;
	startTimestampInput: DateInputProps;
	disabled: boolean;
};

const SearchFormDatetimeControl = ({ form, updateForm, startTimestampInput, disabled }: Props) => {
	const directionClicked = (direction: SearchDirection) => {
		if (disabled || direction === form.searchDirection) return;

		if (form.searchDirection === SearchDirection.Both) {
			updateForm({
				searchDirection:
					direction === SearchDirection.Next ? SearchDirection.Previous : SearchDirection.Next,
			});
		} else {
			updateForm({
				searchDirection: SearchDirection.Both,
			});
		}
	};

	const prevButtonClassName = createBemElement(
		'datetime-control',
		'direction-button',
		'direction-button',
		'prev',
		form.searchDirection === SearchDirection.Previous ||
			form.searchDirection === SearchDirection.Both
			? 'active'
			: null,
		disabled ? 'disabled' : null,
	);

	const prevIconClassName = createBemElement(
		'direction-button',
		'icon',
		'prev',
		form.searchDirection === SearchDirection.Previous ||
			form.searchDirection === SearchDirection.Both
			? 'active'
			: null,
	);

	const nextButtonClassName = createBemElement(
		'datetime-control',
		'direction-button',
		'direction-button',
		'next',
		form.searchDirection === SearchDirection.Next || form.searchDirection === SearchDirection.Both
			? 'active'
			: null,
		disabled ? 'disabled' : null,
	);

	const nextIconClassName = createBemElement(
		'direction-button',
		'icon',
		'next',
		form.searchDirection === SearchDirection.Next || form.searchDirection === SearchDirection.Both
			? 'active'
			: null,
	);

	return (
		<div className='search-form__datetime-control datetime-control'>
			<button
				className={prevButtonClassName}
				onClick={() => directionClicked(SearchDirection.Previous)}>
				<i className={prevIconClassName} />
			</button>
			<div className='datetime-control__input'>
				<FilterDatetimeInput {...startTimestampInput} />
			</div>
			<button
				className={nextButtonClassName}
				onClick={() => directionClicked(SearchDirection.Next)}>
				<i className={nextIconClassName} />
			</button>
		</div>
	);
};

export default SearchFormDatetimeControl;
