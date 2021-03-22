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
import { SearchPanelType } from '../SearchPanel';

type Props = {
	formType: SearchPanelType;
	setFormType: (formType: SearchPanelType) => void;
};

const SearchTypeSwitcher = ({ formType, setFormType }: Props) => {
	return (
		<div className='search-type-switcher'>
			{['event' as typeof formType, 'message' as typeof formType].map(type => (
				<button
					key={type}
					className={createBemElement(
						'search-type-switcher',
						'switch-search-type-button',
						'switch-search-type-button',
						type,
						formType === type ? 'active' : null,
					)}
					onClick={() => setFormType(type)}>
					<i
						className={createBemElement(
							'switch-search-type-button',
							'icon',
							type,
							formType === type ? 'active' : null,
						)}
					/>
					<div className='switch-search-type-button__label'>{type}</div>
				</button>
			))}
		</div>
	);
};

export default SearchTypeSwitcher;
