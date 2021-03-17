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
import moment from 'moment';

interface SearchPanelProgressBarProps {
	searchProgress: {
		startTimestamp: number | null;
		endTimestamp: number | null;
		currentPoint: number;
		searching: boolean;
		processedObjectCount: number;
	};
}

const SearchPanelProgressBar = (props: SearchPanelProgressBarProps) => {
	const {
		searching,
		startTimestamp,
		endTimestamp,
		currentPoint,
		processedObjectCount,
	} = props.searchProgress;
	if (!endTimestamp && searching) {
		return (
			<>
				{processedObjectCount !== 0 && (
					<div className='processed-object-count'>Processed objects: {processedObjectCount}</div>
				)}
				<div className='spinner' />
			</>
		);
	}

	const timeInterval = endTimestamp !== null ? endTimestamp - Number(startTimestamp) : null;

	if (timeInterval) {
		const position = ((currentPoint / timeInterval) * 100).toFixed(2);
		return (
			<>
				{processedObjectCount !== 0 && (
					<div className='processed-object-count'>Processed objects: {processedObjectCount}</div>
				)}
				<div className='progress-bar'>
					<span className='progress-bar-points progress-bar__start'>
						{moment(startTimestamp).utc().format('DD.MM.YYYY')} <br />
						{moment(startTimestamp).utc().format('HH:mm:ss.SSS')}
					</span>
					<div className='progress-bar__track'>
						<div className='progress-bar__line' style={{ left: `${position}%` }} />
					</div>
					<span className='progress-bar-points progress-bar__end'>
						{moment(endTimestamp).utc().format('DD.MM.YYYY')} <br />
						{moment(endTimestamp).utc().format('HH:mm:ss.SSS')}
					</span>
				</div>
			</>
		);
	}
	return null;
};

export default SearchPanelProgressBar;
