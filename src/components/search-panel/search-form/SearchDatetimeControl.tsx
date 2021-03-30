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
};

const SearchFormDatetimeControl = ({ form, updateForm, startTimestampInput }: Props) => {
	return (
		<div className='search-form__datetime-control datetime-control'>
			<button
				className={createBemElement(
					'datetime-control',
					'direction-button',
					'direction-button',
					'prev',
					form.searchDirection === SearchDirection.Previous ||
						form.searchDirection === SearchDirection.Both
						? 'active'
						: null,
				)}
				onClick={() => {
					if (form.searchDirection !== SearchDirection.Previous) {
						updateForm({
							searchDirection:
								form.searchDirection === SearchDirection.Next
									? SearchDirection.Both
									: SearchDirection.Next,
						});
					}
				}}>
				<i
					className={createBemElement(
						'direction-button',
						'icon',
						'prev',
						form.searchDirection === SearchDirection.Previous ||
							form.searchDirection === SearchDirection.Both
							? 'active'
							: null,
					)}
				/>
			</button>
			<div className='datetime-control__input'>
				<FilterDatetimeInput {...startTimestampInput} />
			</div>
			<button
				className={createBemElement(
					'datetime-control',
					'direction-button',
					'direction-button',
					'next',
					form.searchDirection === SearchDirection.Next ||
						form.searchDirection === SearchDirection.Both
						? 'active'
						: null,
				)}
				onClick={() => {
					if (form.searchDirection !== SearchDirection.Next) {
						updateForm({
							searchDirection:
								form.searchDirection === SearchDirection.Previous
									? SearchDirection.Both
									: SearchDirection.Previous,
						});
					}
				}}>
				<i
					className={createBemElement(
						'direction-button',
						'icon',
						'next',
						form.searchDirection === SearchDirection.Next ||
							form.searchDirection === SearchDirection.Both
							? 'active'
							: null,
					)}
				/>
			</button>
		</div>
	);
};

export default SearchFormDatetimeControl;
