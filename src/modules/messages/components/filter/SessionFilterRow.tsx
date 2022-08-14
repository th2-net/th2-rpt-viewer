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

import { FilterRowMultipleStringsConfig } from 'models/filter/FilterInputs';
import FilterRow from 'components/filter/row/FilterRow';

type MessagesFilterSessionFilterProps = {
	config: FilterRowMultipleStringsConfig;
	submitChanges: () => void;
	stopLoading: () => void;
	isLoading: boolean;
};

const MessagesFilterSessionFilter = ({
	config,
	submitChanges,
	stopLoading,
	isLoading,
}: MessagesFilterSessionFilterProps) => (
	<>
		<FilterRow rowConfig={config} />
		<button
			onClick={isLoading ? stopLoading : submitChanges}
			className='messages-window-header__filter-submit-btn'>
			{isLoading ? (
				<i className='messages-window-header__filter-submit-stop-icon' />
			) : (
				<i className='messages-window-header__filter-submit-start-icon' />
			)}
		</button>
	</>
);

export default MessagesFilterSessionFilter;
