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
import { EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { DateTimeMask } from '../models/filter/FilterInputs';
import { TimeRange } from '../models/Timestamp';
import { isEventMessage } from './message';

export function formatTime(time: string | number) {
	if (time == null) {
		return '';
	}
	return moment.utc(new Date(time).getTime()).format(DateTimeMask.DATE_TIME_MASK);
}

export function timestampToNumber(timestamp: string): number {
	return new Date(timestamp).getTime();
}

export function getTimestampAsNumber(entity: EventAction | EventTreeNode | EventMessage): number {
	if (isEventMessage(entity)) return timestampToNumber(entity.timestamp);
	return timestampToNumber(entity.startTimestamp);
}

export function formatTimestampValue(timestamp: number | null, timeMask: string) {
	if (timestamp == null) {
		return '';
	}

	return moment.utc(timestamp).format(timeMask);
}

export function getRangeFromTimestamp(timestamp: number, interval: number): TimeRange {
	return [
		moment(timestamp)
			.subtract(interval / 2, 'minutes')
			.valueOf(),
		moment(timestamp)
			.add(interval / 2, 'minutes')
			.valueOf(),
	];
}

export function sortByTimestamp<T extends { timestamp: number | string }>(
	array: T[],
	order: 'desc' | 'asc' = 'desc',
) {
	const copiedArray = array.slice();
	copiedArray.sort((itemA, itemB) => {
		const timestampA =
			typeof itemA.timestamp === 'number' ? itemA.timestamp : timestampToNumber(itemA.timestamp);
		const timestampB =
			typeof itemB.timestamp === 'number' ? itemB.timestamp : timestampToNumber(itemB.timestamp);

		if (order === 'desc') {
			return timestampB - timestampA;
		}
		return timestampA - timestampB;
	});
	return copiedArray;
}

export function formatTimestamp(timestamp: number, format = 'DD.MM.YYYY HH:mm:ss.SSS'): string {
	return moment.utc(timestamp).format(format);
}
