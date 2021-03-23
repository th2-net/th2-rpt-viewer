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

import moment from 'moment';
import { createBemElement } from 'helpers/styleCreators';

interface SearchPanelProgressBarProps {
	searchProgress: {
		startTimestamp: number | null;
		endTimestamp: number | null;
		currentPoint: number;
		searchDirection: 'next' | 'previous';
		searching: boolean;
		completed: boolean;
		processedObjectCount: number;
	};
}

const toHumanReadableTime = (timestamp: moment.Moment) =>
	timestamp.hour()
		? timestamp.format('H [hours] m [min] s [sec]')
		: timestamp.format('m [min] s [sec]');

const SearchPanelProgressBar = (props: SearchPanelProgressBarProps) => {
	const {
		searching,
		startTimestamp,
		endTimestamp,
		currentPoint,
		searchDirection,
		completed,
		processedObjectCount,
	} = props.searchProgress;

	const timeInterval = endTimestamp !== null ? endTimestamp - Number(startTimestamp) : null;

	const position = completed
		? 100
		: timeInterval && searching
		? ((currentPoint / timeInterval) * 100).toFixed(2)
		: 0;

	const scanningAtTimestamp = Number(startTimestamp) + currentPoint;

	const scanningAtLabel = moment(scanningAtTimestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS');

	const scannedTimeLabel = toHumanReadableTime(moment(Math.abs(currentPoint)).utc());

	const timeLeftLabel = timeInterval
		? toHumanReadableTime(
				moment(timeInterval - (searchDirection === 'next' ? currentPoint : -currentPoint)),
		  )
		: null;

	const progressBarLineClassName = createBemElement(
		'progress-bar',
		'line',
		!timeInterval && searching ? 'infinite' : null,
	);

	return (
		<div className='search-progress'>
			{searching && (
				<div className='search-progress__status'>
					<div className='search-progress__spinner' />
					{startTimestamp && (
						<div className='search-progress__text'>
							<span>
								Scanning at <span className='search-progress__value'>{scanningAtLabel}</span>.
							</span>
							<span>
								<span className='search-progress__value'>{scannedTimeLabel}</span> have been scanned
								already.
							</span>
							{timeInterval && (
								<span>
									<span className='search-progress__value'>{timeLeftLabel}</span> left.
								</span>
							)}
							{processedObjectCount !== 0 && (
								<span>
									Processed objects:{' '}
									<span className='search-progress__value'>{processedObjectCount}</span>
								</span>
							)}
						</div>
					)}
				</div>
			)}
			<div className='search-progress__progress-bar progress-bar'>
				<div className='progress-bar__track'>
					<div className={progressBarLineClassName} style={{ left: `${position}%` }} />
				</div>
			</div>
		</div>
	);
};

export default SearchPanelProgressBar;
