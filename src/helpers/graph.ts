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
import { EventTreeNode, EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { GraphGroup, GraphItem } from '../models/Graph';
import { TimeRange } from '../models/Timestamp';
import { getTimestampAsNumber } from './date';
import { isEventMessage } from './event';
import { isBookmark } from './bookmarks';
import { Bookmark } from '../models/Bookmarks';

export function filterListByChunkRange(
	timeRange: TimeRange,
	list: Array<EventMessage | EventTreeNode | EventAction | Bookmark>,
) {
	const [from, to] = timeRange;
	return list.filter(item => {
		const itemTimestamp = getTimestampAsNumber(isBookmark(item) ? item.item : item);
		return moment(itemTimestamp).isBetween(moment(from), moment(to)) || itemTimestamp === to;
	});
}

export function calculateTimeRange(timestamp: number, interval: number): TimeRange {
	return [timestamp - (interval / 2) * 60 * 1000, timestamp + (interval / 2) * 60 * 1000];
}

export function groupGraphItems(
	timeRange: TimeRange,
	chunkWidth: number,
	items: GraphItem[],
	ATTACHED_ITEM_SIZE_PX: number,
): Array<GraphGroup> {
	const [from, to] = timeRange;
	function getGroupLeftPosition(timestamp: number): number {
		return Math.floor(((timestamp - from) / (to - from)) * chunkWidth);
	}
	const sortedItems = items.slice();
	sortedItems.sort((itemA, itemB) => getTimestampAsNumber(itemA) - getTimestampAsNumber(itemB));

	const positions = sortedItems.map(item => {
		const position = getGroupLeftPosition(getTimestampAsNumber(item));
		return Math.min(
			Math.max(position - ATTACHED_ITEM_SIZE_PX / 2, 0),
			chunkWidth - ATTACHED_ITEM_SIZE_PX,
		);
	});

	const groups: Array<GraphGroup> = [];

	let i = 0;
	let headItem = sortedItems[i];

	while (headItem) {
		const headItemPosition = positions[i];
		const group: GraphGroup = {
			items: [],
			left: positions[i],
		};
		let currItem = sortedItems[i];

		const [leftBoundary, rightBoundary] = [
			headItemPosition,
			headItemPosition + ATTACHED_ITEM_SIZE_PX,
		];

		while (currItem && positions[i] >= leftBoundary && positions[i] <= rightBoundary) {
			group.items.push(currItem);
			currItem = sortedItems[++i];
		}
		groups.push(group);
		headItem = sortedItems[i];
	}

	return groups;
}

export function getGraphTimeTicks(timeRange: TimeRange, interval: number, tickSize: number) {
	const ticksArr = [];

	const [from] = timeRange;

	for (let i = 0; i < interval; i += tickSize) {
		ticksArr.push(moment(from).startOf('minute').add(i, 'minutes').valueOf());
	}

	return ticksArr.map(tick => moment(tick).utc().format('HH:mm'));
}

export function filterUniqueGraphItems(items: GraphItem[]) {
	return items.filter(
		(item, index, self) =>
			index === self.findIndex(selfItem => getGraphItemId(item) === getGraphItemId(selfItem)),
	);
}

export function getGraphItemId(item: GraphItem): string {
	if (isBookmark(item)) return getGraphItemId(item.item);
	if (isEventMessage(item)) return item.messageId;
	return item.eventId;
}

export function getRangeCenter(timerange: TimeRange) {
	return Math.round(timerange[0] + (timerange[1] - timerange[0]) / 2);
}
