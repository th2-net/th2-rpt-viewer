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
import Timestamp from '../models/Timestamp';

export function getSecondsPeriod(
	startTime: string | Date,
	finishTime: string | Date,
	withMiliseconds = true,
) {
	if (!startTime || !finishTime) {
		return '';
	}

	const diff = toDate(finishTime).getTime() - toDate(startTime).getTime();

	const seconds = Math.floor(diff / 1000);
	const milliseconds = diff - seconds * 1000;

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds ? `${seconds}.${millisecondsFormatted}s` : `${seconds}s`;
}

export function getElapsedTime(
	startTimestamp: Timestamp,
	endTimestamp: Timestamp,
	withMiliseconds = true,
) {
	const diff = getTimestampAsNumber(endTimestamp) - getTimestampAsNumber(startTimestamp);
	const seconds = Math.floor(diff / 1000);
	const milliseconds = Math.floor(diff - seconds * 1000);

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds ? `${seconds}.${millisecondsFormatted}s` : `${seconds}s`;
}

export function formatTime(time: string | number) {
	if (time == null) {
		return '';
	}

	return new Date(time).toISOString().replace('T', ' ').replace('Z', '');
}

export function isDateEqual(first: string | Date, second: string | Date): boolean {
	return toDate(first).getTime() === toDate(second).getTime();
}

function toDate(date: string | Date): Date {
	return typeof date === 'string' ? new Date(date) : date;
}

export function getTimeDate(hours: number, minutes: number, seconds: number, ms: number) {
	const date = new Date();
	date.setHours(hours, minutes, seconds, ms);

	return date;
}

export function getTimestampAsNumber(timestamp: Timestamp): number {
	return Math.floor(timestamp.epochSecond * 1000 + timestamp.nano / 1_000_000);
}

export function formatTimestampValue(timestamp: number | null, timeMask: string) {
	if (timestamp == null) {
		return '';
	}

	const date = new Date(timestamp);
	const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
	return moment(utcDate).format(timeMask);
}

type TimeRange = { from: number; to: number };
type TimeRangeOptions = { to: number | Date | Moment; withinTheDay: boolean };

export function getTimeRange(
	minutesOffset: number,
	options: TimeRangeOptions = { to: moment.utc(), withinTheDay: true },
): TimeRange {
	const { to, withinTheDay } = options;
	let from = moment().utc().subtract(minutesOffset, 'minutes');

	if (withinTheDay && !from.isSame(to, 'day')) {
		from = moment().utc().startOf('day');
	}
	return { from: from.valueOf(), to: to.valueOf() };
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

export const isTimeIntersected = (firstRange: [number, number], secondRange: [number, number]) => {
	return (
		(firstRange[0] >= secondRange[0] && firstRange[0] <= secondRange[1]) ||
		(secondRange[0] >= firstRange[0] && secondRange[0] <= secondRange[1])
	);
};

export const toUTC = (date: Moment) => {
	return date.subtract(moment().utcOffset(), 'minutes');
};
