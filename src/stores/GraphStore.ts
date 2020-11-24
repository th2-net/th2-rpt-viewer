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

import { action, observable, reaction } from 'mobx';
import moment from 'moment';
import { Chunk, ChunkData } from '../models/graph';

class GraphStore {
	public readonly intervalOptions = [15, 30, 60];

	private steps = {
		15: 1,
		30: 3,
		60: 5,
	};

	constructor() {
		reaction(
			() => this.interval,
			interval => this.getChunksData(interval, this.timestamp),
		);

		this.getChunksData(this.interval, this.timestamp);
	}

	@observable
	public interval: 15 | 30 | 60 = 15;

	@observable
	public chunks: Chunk[] = [];

	@observable
	public timestamp: number = moment().subtract(this.interval, 'minutes').valueOf();

	@action
	public setTimestamp = (timestamp: number) => {
		this.timestamp = timestamp;
	};

	@action
	public setInterval = (interval: 15 | 30 | 60) => {
		this.interval = interval;
	};

	@action
	public getChunkData = (chunk: Chunk) => {
		const { to, from } = chunk;
		const targetChunk = this.chunks.find(_chunk => _chunk.from === from && _chunk.to === to);
		if (!targetChunk) return;
		const step = this.steps[this.interval];
		const steps = this.interval / step;
		const data: ChunkData[] = [];
		for (let i = 0; i < steps + 1; i++) {
			data.push({
				count: Math.floor(Math.random() * 20),
				timestamp: moment(from)
					.add(step * i, 'minutes')
					.valueOf(),
			});
		}
		targetChunk.data = data;
	};

	@action
	public getChunksData(interval: 15 | 30 | 60, timestamp: number) {
		let chunks: Chunk[] = [this.createChunk(timestamp, interval)];
		for (let i = 1; i < 3; i++) {
			chunks = [
				this.createChunk(
					moment(timestamp)
						.subtract(i * interval, 'minutes')
						.valueOf(),
					interval,
				),
				...chunks,
				this.createChunk(
					moment(timestamp)
						.add(i * interval, 'minutes')
						.valueOf(),
					interval,
				),
			];
		}

		this.chunks = chunks;
	}

	private createChunk = (timestamp: number, interval: 15 | 30 | 60) => {
		return {
			from: moment(timestamp).valueOf(),
			to: moment(timestamp).add(interval, 'minutes').valueOf(),
			data: [],
		};
	};

	@action
	addPreviousChunk = () => {
		const firstChunk = this.chunks[0];

		if (firstChunk) {
			this.chunks = [
				this.createChunk(
					moment(firstChunk.from).subtract(this.interval, 'minutes').valueOf(),
					this.interval,
				),
				...this.chunks.slice(0, 4),
			];
		}
	};

	@action
	addNextChunk = () => {
		const lastChunk = this.chunks[this.chunks.length - 1];

		if (lastChunk) {
			this.chunks = [...this.chunks.slice(1), this.createChunk(lastChunk.to, this.interval)];
		}
	};
}

export default GraphStore;
