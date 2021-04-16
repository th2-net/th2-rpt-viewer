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
	disabled: boolean;
	progress: number | null;
	processedObjectCount: number;
	isPaused: boolean;
	startSearch: () => void;
	pauseSearch: () => void;
};

const SearchSubmit = ({
	isSearching,
	disabled,
	progress,
	processedObjectCount,
	isPaused,
	startSearch,
	pauseSearch,
}: SearchSubmitConfig) => {
	const getButtonTextWithProgress = (defaultText: string) =>
		progress === null ? defaultText : `${progress}%`;

	const [buttonText, buttonState, handleClick] = ((): [string, string, () => void] => {
		if (isSearching) return [getButtonTextWithProgress('Pause'), 'searching', () => pauseSearch()];
		if (isPaused) return [getButtonTextWithProgress('Resume'), 'paused', () => startSearch()];
		return ['Search', 'pending', () => startSearch()];
	})();

	const iconClassName = createBemElement('search-submit-button', 'icon', buttonState);

	return (
		<div className='search-form__submit'>
			{Boolean(processedObjectCount) && (
				<div className='search-processed-objects'> {processedObjectCount} processed objects </div>
			)}
			<button className='search-submit-button' disabled={disabled} onClick={handleClick}>
				<i className={iconClassName} />
				<span className='search-submit-button__label'>{buttonText}</span>
			</button>
		</div>
	);
};

export default SearchSubmit;
