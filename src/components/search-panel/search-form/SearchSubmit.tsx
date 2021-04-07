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

export type SearchSubmitConfig = {
	isSearching: boolean;
	completed: boolean;
	disabled: boolean;
	progress: number | null;
	processedObjectCount: number;
	startSearch: () => void;
	stopSearch: () => void;
};

const SearchSubmit = ({
	isSearching,
	completed,
	disabled,
	progress,
	processedObjectCount,
	startSearch,
	stopSearch,
}: SearchSubmitConfig) => {
	const iconClassName = createBemElement(
		'search-submit-button',
		'icon',
		isSearching ? 'searching' : 'pending',
	);

	const buttonText = !isSearching ? 'Search' : progress === null ? 'Stop' : `${progress}%`;

	return (
		<div className='search-form__submit'>
			{Boolean(processedObjectCount) && (completed || isSearching) && (
				<div className='search-processed-objects'> {processedObjectCount} processed objects </div>
			)}
			<button
				className='search-submit-button'
				disabled={disabled}
				onClick={isSearching ? () => stopSearch() : () => startSearch()}>
				<i className={iconClassName} />
				<span className='search-submit-button__label'>{buttonText}</span>
			</button>
		</div>
	);
};

export default SearchSubmit;
