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

import moment, { Moment } from 'moment';
import { EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { DateTimeMask } from '../models/filter/FilterInputs';
import { TimeRange } from '../models/Timestamp';
import { isEventMessage } from './event';

export function getElapsedTime(
	startTimestamp: number,
	endTimestamp: number,
	withMiliseconds = true,
) {
	const diff = endTimestamp - startTimestamp;
	const seconds = Math.floor(diff / 1000);
	const milliseconds = Math.floor(diff - seconds * 1000);

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds ? `${seconds}.${millisecondsFormatted}s` : `${seconds}s`;
}

export function formatTime(time: string | number) {
	if (time == null) {
		return '';
	}
	return moment.utc(time).format(DateTimeMask.DATE_TIME_MASK);
}

export function getTimestampAsNumber(entity: EventAction | EventTreeNode | EventMessage): number {
	if (isEventMessage(entity)) return entity.timestamp;
	return entity.startTimestamp;
}

export function formatTimestampValue(timestamp: number | null, timeMask: string) {
	if (timestamp == null) {
		return '';
	}

	return moment.utc(timestamp).format(timeMask);
}

export const getTimeWindow = (
	_timestamp: number | null,
	_timeInterval: number | null,
	limitByDay = false,
) => {
	const timestamp = moment.utc(_timestamp);
	const timeInterval = _timeInterval || 15;

	let timestampFrom = moment.utc(timestamp).subtract(timeInterval, 'minutes');
	let timestampTo = moment.utc(timestamp).add(timeInterval, 'minutes');

	if (!limitByDay) {
		return {
			timestampFrom: timestampFrom.valueOf(),
			timestampTo: timestampTo.valueOf(),
		};
	}

	timestampFrom = timestampFrom.isSame(timestamp, 'day') ? timestampFrom : timestamp.startOf('day');
	timestampTo = timestampTo.isSame(timestamp, 'day') ? timestampTo : timestamp.endOf('day');

	return {
		timestampFrom: timestampFrom.valueOf(),
		timestampTo: timestampTo.valueOf(),
	};
};

export const isTimeIntersected = (firstRange: TimeRange, secondRange: TimeRange) =>
	(firstRange[0] >= secondRange[0] && firstRange[0] <= secondRange[1]) ||
	(secondRange[0] >= firstRange[0] && secondRange[0] <= secondRange[1]);

export const isTimeInsideInterval = (timestamp: number, interval: [number, number]) =>
	timestamp >= interval[0] && timestamp <= interval[1];

export const toUTC = (date: Moment) => date.subtract(moment().utcOffset(), 'minutes');

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

export function sortByTimestamp<T extends { timestamp: number }>(
	array: T[],
	order: 'desc' | 'asc' = 'desc',
): T[] {
	const copiedArray = array.slice();
	copiedArray.sort((itemA, itemB) => {
		if (order === 'desc') {
			return itemB.timestamp - itemA.timestamp;
		}
		return itemA.timestamp - itemB.timestamp;
	});
	return copiedArray;
}

export function formatTimestamp(timestamp: number, format = 'DD.MM.YYYY HH:mm:ss.SSS'): string {
	return moment.utc(timestamp).format(format);
}
