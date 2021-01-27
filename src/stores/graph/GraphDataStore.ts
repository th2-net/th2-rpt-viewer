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
import { getTimestampAsNumber, isTimeInsideInterval, isTimeIntersected } from '../../helpers/date';
import { calculateTimeRange } from '../../helpers/graph';
import { Chunk, ChunkData, IntervalData, OverlayValues, IntervalOption } from '../../models/Graph';
import { TimeRange } from '../../models/Timestamp';
import { SelectedStore } from '../SelectedStore';
import WorkspaceStore from '../workspace/WorkspaceStore';
import GraphStore from './GraphStore';

export class GraphDataStore {
	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private selectedStore: SelectedStore,
		timeRange: TimeRange | null = null,
		defaultInterval: IntervalOption = 15,
	) {
		if (timeRange) this.range = timeRange;
		const range = timeRange || this.range;
		this.timestamp = range[0] + (range[1] - range[0]) / 2;
		this.interval = defaultInterval;

		reaction(
			() => this.interval,
			interval => this.createChunks(interval, this.graphStore.timestamp),
		);

		this.createChunks(this.interval, this.graphStore.timestamp);
	}

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

	@action
	public getChunkByTimestamp = (timestampFrom: number) => {
		const existedChunk = this.chunks.find(chunk => chunk.from === timestampFrom);
		if (existedChunk) return existedChunk;

		const chunk = observable(this.createChunk(timestampFrom, this.interval));
		this.chunks.push(chunk);
		return chunk;
	};

	@action
	public getChunkData = (chunk: Chunk, abortSignal?: AbortSignal) => {
		const { from } = chunk;
		const step = this.graphStore.steps[this.interval];
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
		intervalData.connected = this.selectedStore.attachedMessages.filter(message =>
			isTimeInsideInterval(getTimestampAsNumber(message.timestamp), this.range),
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

		return {
			left: {
				pinnedMessages: this.selectedStore.pinnedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) < windowTimeRange[0],
				),
				attachedMessages: this.selectedStore.attachedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) < windowTimeRange[0],
				),
				events: this.selectedStore.pinnedEvents.filter(
					event => getTimestampAsNumber(event.startTimestamp) < windowTimeRange[0],
				),
			},
			right: {
				pinnedMessages: this.selectedStore.pinnedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) > windowTimeRange[1],
				),
				attachedMessages: this.selectedStore.attachedMessages.filter(
					message => getTimestampAsNumber(message.timestamp) > windowTimeRange[1],
				),
				events: this.selectedStore.pinnedEvents.filter(
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

const getRandomNumber = (max = 100) => Math.min(Math.floor(Math.random() * 20), max);
