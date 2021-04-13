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

import * as React from 'react';
import { createBemBlock, createBemElement } from '../../../helpers/styleCreators';
import { FilterRowStringConfig } from '../../../models/filter/FilterInputs';

export default function StringFilterRow({ config }: { config: FilterRowStringConfig }) {
	const inputClassName = createBemElement(
		config.className || 'filter-row',
		'input',
		config.value.length ? 'non-empty' : '',
	);
	const wrapperClassName = createBemBlock(
		config.className || 'filter-row',
		config.wrapperClassName || null,
	);

	return (
		<div className={wrapperClassName}>
			{config.label && (
				<label className={`${config.className || 'filter-row'}__label`} htmlFor={config.id}>
					{config.label}
				</label>
			)}
			<input
				type='text'
				className={inputClassName}
				id={config.id}
				disabled={config.disabled}
				value={config.value}
				placeholder={config.placeholder}
				onChange={e => config.setValue(e.target.value)}
			/>
		</div>
	);
}
