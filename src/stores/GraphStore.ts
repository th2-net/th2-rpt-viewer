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
import debounce from 'lodash.debounce';
import { getTimestampAsNumber } from '../helpers/date';
import { isEvent } from '../helpers/event';
import { calculateTimeRange, getRangeCenter } from '../helpers/graph';
import { Chunk, GraphItem, GraphItemType } from '../models/Graph';
import { TimeRange } from '../models/Timestamp';
import { SelectedStore } from './SelectedStore';
import { isBookmark } from '../helpers/bookmarks';
import BooksStore from './BooksStore';

export class GraphStore {
	constructor(
		private selectedStore: SelectedStore,
		private booksStore: BooksStore,
		timeRange: TimeRange | null = null,
		defaultInterval: number | null | undefined,
	) {
		this.range = timeRange || this.range;
		this.setTimestampFromRange(this.range);

		this.eventInterval = defaultInterval || 15;
		this.graphInterval = 15;

		const debouncedUpdateScopes = debounce(
			() => this.booksStore.getScopeList(this.booksStore.selectedBook),
			1000,
		);

		reaction(
			() => this.graphInterval,
			interval => this.createChunks(interval, this.timestamp.valueOf()),
		);

		reaction(
			() => this.graphInterval,
			() => this.createChunks(this.graphInterval, this.timestamp.valueOf()),
		);

		reaction(
			() => this.range,
			() => {
				debouncedUpdateScopes();
			},
		);

		this.createChunks(this.graphInterval, this.timestamp.valueOf());
	}

	@observable
	public eventInterval = 15;

	@observable
	public graphInterval = 15;

	@observable
	public chunks: Chunk[] = [];

	@observable
	public timestamp: Number = new Number(
		moment
			.utc()
			.subtract(this.eventInterval / 2, 'minutes')
			.valueOf(),
	);

	@observable
	public range: TimeRange = calculateTimeRange(
		moment.utc(this.timestamp.valueOf()).valueOf(),
		this.eventInterval,
	);

	@observable
	public hoveredTimestamp: number | null = null;

	@computed
	public get tickSize() {
		if (this.graphInterval <= 15) return 1;
		return Math.floor(this.graphInterval / 10);
	}

	@action
	public setTimestamp = (timestamp: number) => {
		this.timestamp = new Number(timestamp);
	};

	@action
	public setEventInterval = (interval: number) => {
		this.eventInterval = interval;
	};

	@action
	public setGraphInterval = (interval: number) => {
		this.graphInterval = interval;
	};

	@action
	public setRange = (range: TimeRange) => {
		this.range = range;
	};

	@action
	public getChunkByTimestamp = (timestamp: number) => {
		let chunk: Chunk | undefined = this.chunks.find(c => timestamp >= c.from && timestamp <= c.to);
		if (chunk) return chunk;

		const centralChunkStart = this.getChunkTimestampFrom(timestamp, this.graphInterval);
		chunk = observable(this.createChunk(centralChunkStart, this.graphInterval));
		this.chunks.push(chunk);

		return chunk;
	};

	@action
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getChunkData = (chunk: Chunk, abortSignal?: AbortSignal) => {
		// TODO: implement chunk data fetching
	};

	@action
	public createChunks(interval: number, timestamp: number) {
		this.chunks = [];

		const centralChunkStart = this.getChunkTimestampFrom(timestamp, interval);
		const centralChunk = this.createChunk(centralChunkStart, interval);

		const chunks: Chunk[] = [centralChunk];

		for (let i = 1; i < 4; i++) {
			chunks.unshift(
				this.createChunk(
					moment
						.utc(centralChunkStart)
						.subtract(interval * i, 'minutes')
						.valueOf(),
					interval,
				),
			);
			chunks.push(
				this.createChunk(
					moment
						.utc(centralChunkStart)
						.add(interval * i, 'minutes')
						.valueOf(),
					interval,
				),
			);
		}

		this.chunks = chunks;
	}

	private createChunk = (timestamp: number, interval: number) => ({
		from: moment.utc(timestamp).valueOf(),
		to: moment
			.utc(timestamp)
			.add(interval - 1, 'minutes')
			.endOf('minute')
			.valueOf(),
		data: [],
	});

	public getGraphItemType = (item: GraphItem): GraphItemType => {
		if (isBookmark(item)) return this.getGraphItemType(item.item);
		if (isEvent(item)) {
			return item.eventId === this.selectedStore.hoveredEvent?.eventId
				? item.successful
					? GraphItemType.HOVERED_EVENT_PASSED
					: GraphItemType.HOVERED_EVENT_FAILED
				: this.selectedStore.savedItems.includes(item as any)
				? item.successful
					? GraphItemType.BOOKMARKED_PASSED
					: GraphItemType.BOOKMARKED_FAILED
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

	@action
	public setTimestampFromRange = (range: TimeRange) => {
		this.timestamp = new Number(getRangeCenter(range));
	};

	@action
	public goToGraphItem = (savedItem: GraphItem) => {
		this.setTimestamp(getTimestampAsNumber(savedItem));
	};

	@action
	public setHoveredTimestamp = (item: GraphItem | null) => {
		this.hoveredTimestamp = item ? getTimestampAsNumber(item) : null;
	};

	public getChunkTimestampFrom = (timestamp: number, interval: number): number => {
		const chunkHourStart = moment.utc(timestamp).startOf('hour');

		return chunkHourStart
			.add(Math.ceil(moment.utc(timestamp).get('minutes') / interval) * interval, 'minutes')
			.valueOf();
	};
}
