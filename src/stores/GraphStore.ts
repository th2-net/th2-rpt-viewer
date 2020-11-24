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

import { action, computed, observable } from 'mobx';
import moment from 'moment';
import { generateGraphValues } from '../helpers/graph';
import { Chunk, ChunkData } from '../models/graph';

class GraphStore {
	@observable public timestamp: number = Date.now();

	@observable public interval: 15 | 30 | 60 = 15;

	@observable public graphValues: Map<number, number> = new Map();

	@action setTimestamp = (timestamp: number) => {
		this.timestamp = timestamp;
	};

	@action setInterval = (interval: 15 | 30 | 60) => {
		this.interval = interval;
	};

	@action loadChunkData = (from: number, to: number): ChunkData[] => {
		return generateGraphValues(from, to);
	};

	@computed get timelineRange(): [Chunk, Chunk, Chunk, Chunk, Chunk] {
		return [
			{
				from: moment(this.timestamp)
					.subtract(this.interval * 2.5, 'minutes')
					.valueOf(),
				to: moment(this.timestamp)
					.subtract(this.interval * 1.5, 'minutes')
					.valueOf(),
			},
			{
				from: moment(this.timestamp)
					.subtract(this.interval * 1.5, 'minutes')
					.valueOf(),
				to: moment(this.timestamp)
					.subtract(this.interval * 0.5, 'minutes')
					.valueOf(),
			},
			{
				from: moment(this.timestamp)
					.subtract(this.interval * 0.5, 'minutes')
					.valueOf(),
				to: moment(this.timestamp)
					.add(this.interval * 0.5, 'minutes')
					.valueOf(),
			},
			{
				from: moment(this.timestamp)
					.add(this.interval * 0.5, 'minutes')
					.valueOf(),
				to: moment(this.timestamp)
					.add(this.interval * 1.5, 'minutes')
					.valueOf(),
			},
			{
				from: moment(this.timestamp)
					.add(this.interval * 1.5, 'minutes')
					.valueOf(),
				to: moment(this.timestamp)
					.add(this.interval * 2.5, 'minutes')
					.valueOf(),
			},
		];
	}
}

export default GraphStore;
