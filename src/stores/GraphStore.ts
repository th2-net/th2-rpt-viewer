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
import { isEventNode } from '../helpers/event';
import { calculateTimeRange } from '../helpers/graph';
import { Chunk, GraphItem, GraphItemType, IntervalOption } from '../models/Graph';
import { TimeRange } from '../models/Timestamp';
import { SelectedStore } from './SelectedStore';

export class GraphStore {
	public readonly steps = {
		15: 1,
		30: 3,
		60: 5,
	};

	constructor(
		private selectedStore: SelectedStore,
		timeRange: TimeRange | null = null,
		defaultInterval: IntervalOption = 15,
	) {
		if (timeRange) this.range = timeRange;
		const range = timeRange || this.range;
		this.setTimestampFromRange(range);
		this.interval = defaultInterval;

		reaction(
			() => this.interval,
			interval => this.createChunks(interval, this.timestamp),
		);

		reaction(
			() => this.timestamp,
			() => (this.chunks = []),
		);

		this.createChunks(this.interval, this.timestamp);
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getChunkData = (chunk: Chunk, abortSignal?: AbortSignal) => {
		// TODO: implement chunk data fetching
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

	public getGraphItemType = (item: GraphItem): GraphItemType => {
		return isEventNode(item)
			? GraphItemType.EVENT
			: this.selectedStore.attachedMessages.includes(item)
			? GraphItemType.ATTACHED_MESSAGE
			: GraphItemType.PINNED_MESSAGE;
	};

	setTimestampFromRange = (range: TimeRange) => {
		this.timestamp = range[0] + (range[1] - range[0]) / 2;
	};
}
