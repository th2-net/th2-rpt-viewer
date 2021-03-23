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

import { action, computed, observable, reaction, makeObservable } from 'mobx';
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
		makeObservable(this, {
			interval: observable,
			chunks: observable,
			timestamp: observable,
			range: observable,
			tickSize: computed,
			setTimestamp: action,
			setInterval: action,
			setRange: action,
			getChunkByTimestamp: action,
			getChunkData: action,
			createChunks: action,
			setTimestampFromRange: action,
		});

		this.range = timeRange || this.range;
		this.setTimestampFromRange(this.range);

		this.interval = defaultInterval;

		reaction(
			() => this.interval,
			interval => this.createChunks(interval, this.timestamp.valueOf()),
		);

		reaction(
			() => this.timestamp,
			() => this.createChunks(this.interval, this.timestamp.valueOf()),
		);

		this.createChunks(this.interval, this.timestamp.valueOf());
	}

	public interval: IntervalOption = 15;

	public chunks: Chunk[] = [];

	public timestamp: Number = new Number(
		moment
			.utc()
			.subtract(this.interval / 2, 'minutes')
			.valueOf(),
	);

	public range: TimeRange = calculateTimeRange(
		moment.utc(this.timestamp.valueOf()).valueOf(),
		this.interval,
	);

	public get tickSize(): number {
		return this.steps[this.interval];
	}

	public setTimestamp = (timestamp: number): void => {
		this.timestamp = new Number(timestamp);
	};

	public setInterval = (interval: IntervalOption): void => {
		this.interval = interval;
	};

	public setRange = (range: TimeRange): void => {
		this.range = range;
	};

	public getChunkByTimestamp = (timestamp: number): Chunk => {
		let chunk: Chunk | undefined = this.chunks.find(c => timestamp === c.from);
		if (chunk) return chunk;
		chunk = observable(
			this.createChunk(moment.utc(timestamp).startOf('minute').valueOf(), this.interval),
		);
		this.chunks.push(chunk);
		return chunk;
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getChunkData = (chunk: Chunk, abortSignal?: AbortSignal): void => {
		// TODO: implement chunk data fetching
	};

	public createChunks(interval: IntervalOption, timestamp: number): void {
		this.chunks = [];
		const chunkStart = moment
			.utc(timestamp)
			.subtract(interval * 3.5, 'minutes')
			.startOf('minute');
		const chunks: Chunk[] = [];

		while (chunks.length !== 7) {
			chunks.push(this.createChunk(chunkStart.valueOf(), interval));
			chunkStart.add(interval, 'minutes');
		}

		this.chunks = chunks;
	}

	private createChunk = (timestamp: number, interval: IntervalOption): Chunk => ({
		from: timestamp,
		to: moment(timestamp)
			.add(interval - 1, 'minutes')
			.endOf('minute')
			.valueOf(),
		data: [],
	});

	public getGraphItemType = (item: GraphItem): GraphItemType => {
		if (isEventNode(item)) {
			return item.eventId === this.selectedStore.hoveredEvent?.eventId
				? GraphItemType.HOVERED_EVENT
				: item.successful
				? GraphItemType.PASSED
				: GraphItemType.FAILED;
		}
		return item.messageId === this.selectedStore.hoveredMessage?.messageId
			? GraphItemType.HOVERED_MESSAGE
			: this.selectedStore.attachedMessages.findIndex(
					attMsg => attMsg.messageId === item.messageId,
			  ) !== -1
			? GraphItemType.ATTACHED_MESSAGE
			: GraphItemType.PINNED_MESSAGE;
	};

	public setTimestampFromRange = (range: TimeRange): void => {
		this.timestamp = new Number(range[0] + (range[1] - range[0]) / 2);
	};
}
