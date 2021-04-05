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
import TimeLimitControl from './TimeLimitControl';

export type SearchTimeLimitControlsConfig = {
	isSearching: boolean;
	completed: boolean;
	searchDirection: SearchDirection;
	disabled: boolean;
	previousTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	nextTimeLimit: {
		value: number | null;
		setValue: (value: number | null) => void;
	};
	progress: number | null;
	processedObjectCount: number;
	startSearch: () => void;
	stopSearch: () => void;
};

const SearchTimeLimitControls = ({
	isSearching,
	completed,
	searchDirection,
	disabled,
	previousTimeLimit,
	nextTimeLimit,
	progress,
	processedObjectCount,
	startSearch,
	stopSearch,
}: SearchTimeLimitControlsConfig) => {
	const iconClassName = createBemElement(
		'search-submit-button',
		'icon',
		isSearching ? 'searching' : 'pending',
	);

	const buttonText = !isSearching ? 'Search' : progress === null ? 'Stop' : `${progress}%`;

	return (
		<div className='search-time-limit-controls'>
			<div className='search-time-limit-controls__previous'>
				<TimeLimitControl
					value={previousTimeLimit.value}
					setValue={previousTimeLimit.setValue}
					disabled={disabled}
					readonly={isSearching}
					hidden={searchDirection === SearchDirection.Next}
				/>
			</div>
			<div className='search-time-limit-controls__submit'>
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
			<div className='search-time-limit-controls__next'>
				<TimeLimitControl
					value={nextTimeLimit.value}
					setValue={nextTimeLimit.setValue}
					disabled={disabled || searchDirection === SearchDirection.Previous}
					readonly={isSearching}
					hidden={searchDirection === SearchDirection.Previous}
				/>
			</div>
		</div>
	);
};

export default SearchTimeLimitControls;
