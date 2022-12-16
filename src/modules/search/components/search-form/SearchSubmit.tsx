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

import { Button } from 'components/buttons/Button';

export type SearchSubmitConfig = {
	isSearching: boolean;
	disabled: boolean;
	startSearch: () => void;
	stopSearch: () => void;
};

const SearchSubmit = ({ isSearching, disabled, startSearch, stopSearch }: SearchSubmitConfig) => {
	const buttonText = isSearching ? 'Stop' : 'Search';

	const handleClick = isSearching ? stopSearch : startSearch;

	return (
		<div className='search-panel-form__submit'>
			<Button variant='contained' disabled={disabled} onClick={handleClick}>
				<span className='search-submit-button__label'>{buttonText}</span>
			</Button>
		</div>
	);
};

export default SearchSubmit;
