/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import Timestamp from '../models/Timestamp';

export function getSecondsPeriod(startTime: string | Date, finishTime: string | Date, withMiliseconds = true) {
	if (!startTime || !finishTime) {
		return '';
	}

	const diff = toDate(finishTime).getTime() - toDate(startTime).getTime();

	const seconds = Math.floor(diff / 1000);
	const milliseconds = diff - (seconds * 1000);

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds
		? `${seconds}.${millisecondsFormatted}s`
		: `${seconds}s`;
}

export function getElapsedTime(startTimestamp: Timestamp, endTimestamp: Timestamp, withMiliseconds = true) {
	const diff = getTimestampAsNumber(endTimestamp) - getTimestampAsNumber(startTimestamp);
	const seconds = Math.floor(diff / 1000);
	const milliseconds = Math.floor(diff - (seconds * 1000));

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds
		? `${seconds}.${millisecondsFormatted}s`
		: `${seconds}s`;
}

export function formatTime(time: string | number) {
	if (time == null) {
		return '';
	}

	return new Date(time)
		.toISOString()
		.replace('T', ' ')
		.replace('Z', '');
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
