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
import { AttachedItem, AttachedItemGroup } from '../components/graph/GraphChunk';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { Chunk } from '../models/Graph';
import { TimeRange } from '../models/Timestamp';
import { getTimestampAsNumber } from './date';
import { isEventMessage, isEventNode } from './event';

export function filterListByChunkRange(chunk: Chunk, list: Array<EventMessage | EventTreeNode>) {
	return list.filter(item => {
		const itemTimestamp = getTimestampAsNumber(
			isEventNode(item) ? item.startTimestamp : item.timestamp,
		);
		return (
			moment(itemTimestamp).isBetween(moment(chunk.from), moment(chunk.to)) ||
			itemTimestamp === chunk.to
		);
	});
}

export function calculateTimeRange(timestamp: number, interval: number): TimeRange {
	return [timestamp - (interval / 2) * 60 * 1000, timestamp + (interval / 2) * 60 * 1000];
}

export function groupGraphItems(
	from: number,
	to: number,
	chunkWidth: number,
	items: AttachedItem[],
	ATTACHED_ITEM_SIZE: number,
): Array<AttachedItemGroup> {
	const getGroupLeftPosition = (timestamp: number) => {
		return Math.floor(((timestamp - from) / (to - from)) * chunkWidth);
	};

	const positions = items.map(item =>
		getGroupLeftPosition(
			getTimestampAsNumber(
				isEventMessage(item.value) ? item.value.timestamp : item.value.startTimestamp,
			),
		),
	);

	const groups: Array<AttachedItemGroup> = [];

	let i = 0;
	let headItem = items[i];

	while (headItem) {
		const headItemPosition = positions[i];
		const group: AttachedItemGroup = {
			items: [],
			left: positions[i],
		};
		let currItem = items[i];

		const [leftBoundary, rightBoundary] = [
			headItemPosition - ATTACHED_ITEM_SIZE,
			headItemPosition + ATTACHED_ITEM_SIZE,
		];

		while (currItem && positions[i] >= leftBoundary && positions[i] <= rightBoundary) {
			group.items.push(currItem);
			currItem = items[++i];
		}
		groups.push(group);
		headItem = items[i];
	}

	return groups;
}

export function getGraphTimeTicks(from: number, to: number, interval: number, tickSize: number) {
	const ticksArr = [];

	const ticksInterval = (to - from) / interval / 1000 / 60;

	for (let i = 0; i < interval; i += tickSize) {
		ticksArr.push(
			moment(from)
				.add(ticksInterval * i, 'minutes')
				.valueOf(),
		);
	}

	return ticksArr.map(tick => moment(tick).utc().format('HH:mm'));
}
