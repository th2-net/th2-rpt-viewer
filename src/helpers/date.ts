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
import { TimeRange, Timestamp } from '../models/Timestamp';
import { isEventMessage } from './event';

export function getElapsedTime(
	startTimestamp: Timestamp,
	endTimestamp: Timestamp,
	withMiliseconds = true,
): string {
	const diff = timestampToNumber(endTimestamp) - timestampToNumber(startTimestamp);
	const seconds = Math.floor(diff / 1000);
	const milliseconds = Math.floor(diff - seconds * 1000);

	const millisecondsFormatted = milliseconds === 0 ? '0' : milliseconds.toString().padStart(3, '0');

	return withMiliseconds ? `${seconds}.${millisecondsFormatted}s` : `${seconds}s`;
}

export function formatTime(time: string | number): string {
	if (time == null) {
		return '';
	}

	return new Date(time).toISOString().replace('T', ' ').replace('Z', '');
}

export function timestampToNumber(timestamp: Timestamp): number {
	return Math.floor(timestamp.epochSecond * 1000 + timestamp.nano / 1_000_000);
}

export function getTimestampAsNumber(entity: EventAction | EventTreeNode | EventMessage): number {
	if (isEventMessage(entity)) return timestampToNumber(entity.timestamp);
	return timestampToNumber(entity.startTimestamp);
}

export function formatTimestampValue(timestamp: number | null, timeMask: string): string {
	if (timestamp == null) {
		return '';
	}

	const date = new Date(timestamp);
	const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
	return moment(utcDate).format(timeMask);
}

export function isTimeIntersected(firstRange: TimeRange, secondRange: TimeRange): boolean {
	return (
		(firstRange[0] >= secondRange[0] && firstRange[0] <= secondRange[1]) ||
		(secondRange[0] >= firstRange[0] && secondRange[0] <= secondRange[1])
	);
}

export function isTimeInsideInterval(timestamp: number, interval: [number, number]): boolean {
	return timestamp >= interval[0] && timestamp <= interval[1];
}
