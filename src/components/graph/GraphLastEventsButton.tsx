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
import React from 'react';

type GraphLastEventsButtonProps = {
	onTimestampSubmit: (timestamp: number) => void;
	setRange: (timestamp: number) => void;
	interval: number;
};

const GraphLastEventsButton = ({
	onTimestampSubmit,
	setRange,
	interval,
}: GraphLastEventsButtonProps) => {
	const showLastEvents = () => {
		const currectTime = moment().utc();

		const timeOffset = (interval / 2) * 1000 * 60;
		onTimestampSubmit(currectTime.valueOf() - timeOffset);
		setRange(currectTime.valueOf() - timeOffset);
	};

	return (
		<button onClick={showLastEvents} className='graph-last-events-button graph-button'>
			Show last events
		</button>
	);
};

export default GraphLastEventsButton;