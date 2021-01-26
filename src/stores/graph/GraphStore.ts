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

import { action, observable } from 'mobx';
import moment from 'moment';
import { calculateTimeRange } from '../../helpers/graph';
import { Chunk, intervalOptions, IntervalOption } from '../../models/graph';
import { TimeRange } from '../../models/Timestamp';

class GraphStore {
	public readonly intervalOptions = intervalOptions;

	public readonly steps = {
		15: 1,
		30: 3,
		60: 5,
	};

	@observable
	public interval: IntervalOption = 15;

	@observable
	public chunks: Chunk[] = [];

	@observable
	public timestamp: number = moment()
		.utc()
		.subtract(this.interval / 2, 'minutes')
		.valueOf();

	@observable
	public range: TimeRange = calculateTimeRange(
		moment(this.timestamp).utc().valueOf(),
		this.interval,
	);

	@action
	public setTimestamp = (timestamp: number) => {
		this.timestamp = timestamp;
	};

	@action
	public setInterval = (interval: IntervalOption) => {
		this.interval = interval;
	};

	@action
	public setRange = (range: TimeRange) => {
		this.range = range;
	};
}

export default GraphStore;
