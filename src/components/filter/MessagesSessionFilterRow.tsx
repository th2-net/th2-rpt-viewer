/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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
import { FilterRowMultipleStringsConfig } from '../../models/filter/FilterInputs';
import FilterRow from './row';

type MessagesFilterSessionFilterProps = {
	config: FilterRowMultipleStringsConfig;
	submitChanges: () => void;
};

const MessagesFilterSessionFilter = ({
	config,
	submitChanges,
}: MessagesFilterSessionFilterProps) => {
	return (
		<>
			<FilterRow rowConfig={config} />
			<button onClick={submitChanges} className='messages-window-header__filter-submit-btn'>
				<i className='messages-window-header__filter-submit-icon' />
			</button>
		</>
	);
};

export default MessagesFilterSessionFilter;
