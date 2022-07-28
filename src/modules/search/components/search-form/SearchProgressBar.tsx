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

import { createBemElement } from 'helpers/styleCreators';
import { SearchDirection } from 'models/SearchDirection';

type Progress = {
	completed: boolean;
	isInfinite: boolean;
	progress: number;
};

export type SearchProgressBarConfig = {
	isSearching: boolean;
	searchDirection: SearchDirection | null;
	leftProgress: Progress;
	rightProgress: Progress;
};

const getLineWidth = ({
	isSearching,
	isInfinite,
	completed,
	progress,
}: {
	isSearching: boolean;
	isInfinite: boolean;
	completed: boolean;
	progress: number;
}) => {
	if (completed) return 100;
	if (isSearching) {
		if (isInfinite) return 100;
		return progress;
	}
	return 0;
};

const SearchProgressBar = (props: SearchProgressBarConfig) => {
	const { isSearching, searchDirection, leftProgress, rightProgress } = props;

	const leftLineWidth = getLineWidth({ isSearching, ...leftProgress });
	const rightLineWidth = getLineWidth({ isSearching, ...rightProgress });

	const leftWrapperClassName = createBemElement(
		'search-progress-bar',
		'line-wrapper',
		'left',
		searchDirection === SearchDirection.Next ? 'hidden' : null,
	);

	const leftLineClassName = createBemElement(
		'search-progress-bar',
		'line',
		'left',
		isSearching ? 'searching' : null,
		isSearching && leftProgress.isInfinite ? 'infinite' : null,
		searchDirection === SearchDirection.Both || searchDirection === SearchDirection.Previous
			? 'rounded-left'
			: null,
		isSearching && searchDirection === SearchDirection.Previous ? 'rounded-right' : null,
	);

	const rightWrapperClassName = createBemElement(
		'search-progress-bar',
		'line-wrapper',
		'right',
		searchDirection === SearchDirection.Previous ? 'hidden' : null,
	);

	const startPointClassName = createBemElement(
		'search-progress-bar',
		'start-point',
		isSearching || !searchDirection ? 'hidden' : null,
	);

	const rightLineClassName = createBemElement(
		'search-progress-bar',
		'line',
		'right',
		isSearching ? 'searching' : null,
		isSearching && rightProgress.isInfinite ? 'infinite' : null,
		searchDirection === SearchDirection.Both || searchDirection === SearchDirection.Next
			? 'rounded-right'
			: null,
		isSearching && searchDirection === SearchDirection.Next ? 'rounded-left' : null,
	);

	return (
		<div className='search-progress-bar'>
			<div className={leftWrapperClassName}>
				<div
					className={leftLineClassName}
					style={{
						width: `${leftLineWidth}%`,
					}}
				/>
			</div>
			<div className={startPointClassName} />
			<div className={rightWrapperClassName}>
				<div
					className={rightLineClassName}
					style={{
						width: `${rightLineWidth}%`,
					}}
				/>
			</div>
		</div>
	);
};

export default SearchProgressBar;
