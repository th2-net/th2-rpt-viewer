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

import { ActionType, EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { EventStatus } from '../models/Status';
import { getTimestampAsNumber } from './date';

export function getMinifiedStatus(status: string): string {
	return status
		.split('_')
		.map(str => str[0])
		.join('')
		.toUpperCase();
}

export const getEventStatus = (event: EventAction | EventTreeNode): EventStatus =>
	event.successful ? EventStatus.PASSED : EventStatus.FAILED;

export const isRootEvent = (event: EventTreeNode): boolean => event.parentId === 'null';

export function mapToTimestamps(list: Array<EventAction | EventMessage>) {
	return list.map(item => getTimestampAsNumber(getTimestamp(item)));
}

export function getTimestamp(item: EventAction | EventMessage | EventTreeNode) {
	if ('startTimestamp' in item) {
		return item.startTimestamp;
	}
	return item.timestamp;
}

export const getEventNodeParents = (event: EventTreeNode): string[] =>
	event.parents ? event.parents : [];

export const sortEventsByTimestamp = (
	eventNodes: Array<EventTreeNode>,
	order: 'desc' | 'asc' = 'desc',
) => {
	const copiedEvents = eventNodes.slice();
	copiedEvents.sort((eventA, eventB) => {
		if (order === 'desc') {
			return (
				getTimestampAsNumber(eventB.startTimestamp) - getTimestampAsNumber(eventA.startTimestamp)
			);
		}
		return (
			getTimestampAsNumber(eventA.startTimestamp) - getTimestampAsNumber(eventB.startTimestamp)
		);
	});
	return copiedEvents;
};

export const isEventMessage = (object: unknown): object is EventMessage => {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as EventMessage).type === ActionType.MESSAGE
	);
};

export const isEventAction = (object: unknown): object is EventAction => {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as EventAction).type === ActionType.EVENT_ACTION
	);
};

export const sortByTimestamp = (
	itmes: Array<EventAction | EventMessage>,
	order: 'desc' | 'asc' = 'desc',
) => {
	const copiedEvents = itmes.slice();
	copiedEvents.sort((eventA, eventB) => {
		if (order === 'desc') {
			return (
				getTimestampAsNumber(getTimestamp(eventB)) - getTimestampAsNumber(getTimestamp(eventA))
			);
		}
		return getTimestampAsNumber(getTimestamp(eventA)) - getTimestampAsNumber(getTimestamp(eventB));
	});
	return copiedEvents;
};
