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

import { action, computed, observable, reaction } from 'mobx';
import moment from 'moment';
import { getTimestampAsNumber, isTimeInsideInterval, isTimeIntersected } from '../helpers/date';
import { calculateTimeRange } from '../helpers/graph';
import { Chunk, ChunkData, IntervalData, OverlayValues } from '../models/graph';
import RootStore from './RootStore';

export const intervalOptions = [15, 30, 60] as const;

export type IntervalOption = typeof intervalOptions[number];

class GraphStore {
	public readonly intervalOptions = intervalOptions;

	readonly steps = {
		15: 1,
		30: 3,
		60: 5,
	};

	constructor(private rootStore: RootStore, initialRange: [number, number] | null) {
		reaction(
			() => this.interval,
			interval => this.createChunks(interval, this.timestamp),
		);

		if (initialRange) {
			const [from, to] = initialRange;
			this.timestamp = from + (to - from) / 2;
			this.range = initialRange;
		}

		this.createChunks(this.interval, this.timestamp);
	}

	@observable
	public interval: IntervalOption = 15;

	@observable
	public chunks: Chunk[] = [];

	@observable
	public timestamp: number = moment().utc().valueOf();

	@observable
	public range: [number, number] = calculateTimeRange(
		moment(this.timestamp).utc().valueOf(),
		this.interval,
	);

	@computed get tickSize() {
		return this.steps[this.interval];
	}

	@action
	public setTimestamp = (timestamp: number) => {
		this.timestamp = timestamp;
	};

	@action
	public setInterval = (interval: IntervalOption) => {
		this.interval = interval;
	};

	@action
	public setRange = (range: [number, number]) => {
		this.range = range;
	};

	@action
	public getChunkByTimestamp = (timestampFrom: number) => {
		const existedChunk = this.chunks.find(chunk => chunk.from === timestampFrom);
		if (existedChunk) return existedChunk;

		const chunk = observable(this.createChunk(timestampFrom, this.interval));
		this.chunks.push(chunk);
		return chunk;
	};

	@action
	public getChunkData = (chunk: Chunk) => {
		const { from } = chunk;
		const step = this.tickSize;
		const steps = this.interval / step;
		const data: ChunkData[] = [];
		for (let i = 0; i < steps + 1; i++) {
			data.push({
				events: getRandomNumber(),
				timestamp: moment(from)
					.add(step * i, 'minutes')
					.valueOf(),
				failed: getRandomNumber(),
				messages: getRandomNumber(),
				passed: getRandomNumber(),
			});
		}

		// eslint-disable-next-line no-param-reassign
		chunk.data = data;
	};

	@action getIntervalData = (): IntervalData => {
		const intervalData: IntervalData = {
			events: 0,
			passed: 0,
			failed: 0,
			messages: 0,
			connected: 0,
		};
		this.chunks.forEach(chunk => {
			if (isTimeIntersected([chunk.from, chunk.to], this.range)) {
				chunk.data.forEach(data => {
					if (isTimeInsideInterval(data.timestamp, this.range)) {
						intervalData.events += data.events;
						intervalData.passed += data.passed;
						intervalData.failed += data.failed;
						intervalData.messages += data.messages;
					}
				});
			}
		});
		intervalData.connected = this.rootStore.workspacesStore.selectedStore.attachedMessages.filter(
			message => isTimeInsideInterval(getTimestampAsNumber(message.timestamp), this.range),
		).length;

		return intervalData;
	};

	public getOverlayValues = (): OverlayValues => {
		const windowTimeRange = [
			moment(this.range[0])
				.subtract(this.interval / 2, 'minutes')
				.valueOf(),
			moment(this.range[1])
				.add(this.interval / 2, 'minutes')
				.valueOf(),
		];

		const selectedStore = this.rootStore.workspacesStore.selectedStore;
		return {
			left: {
				pinnedMessages: selectedStore.pinnedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) < windowTimeRange[0],
				),
				attachedMessages: selectedStore.attachedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) < windowTimeRange[0],
				),
				events: selectedStore.pinnedEvents.filter(
					event => getTimestampAsNumber(event.startTimestamp) < windowTimeRange[0],
				),
			},
			right: {
				pinnedMessages: selectedStore.pinnedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) > windowTimeRange[1],
				),
				attachedMessages: selectedStore.attachedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) > windowTimeRange[1],
				),
				events: selectedStore.pinnedEvents.filter(
					event => getTimestampAsNumber(event.startTimestamp) > windowTimeRange[1],
				),
			},
		};
	};

	@action
	public createChunks(interval: IntervalOption, timestamp: number) {
		let chunks: Chunk[] = [this.createChunk(timestamp, interval)];
		for (let i = 1; i < 3; i++) {
			chunks = [
				this.createChunk(
					moment(timestamp)
						.startOf('minute')
						.subtract(i * interval, 'minutes')
						.valueOf(),
					interval,
				),
				...chunks,
				this.createChunk(
					moment(timestamp)
						.startOf('minute')
						.add(i * interval, 'minutes')
						.valueOf(),
					interval,
				),
			];
		}

		this.chunks = chunks;
	}

	private createChunk = (timestamp: number, interval: IntervalOption) => {
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

const getRandomNumber = (max = 100) => Math.min(Math.floor(Math.random() * 20), max);
