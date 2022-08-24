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

import { isEventMessage } from './message';
import { ActionType, EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { EventStatus } from '../modules/events/models/Status';
import { getTimestampAsNumber, timestampToNumber } from './date';

export function getEventStatus(event: EventAction | EventTreeNode): EventStatus {
	return event.successful ? EventStatus.PASSED : EventStatus.FAILED;
}

export const isRootEvent = (event: EventTreeNode): boolean => event.parentId === null;

export function mapToTimestamps(list: Array<EventTreeNode | EventMessage>) {
	return list.map(item => getTimestampAsNumber(item));
}

export function getTimestamp(item: EventAction | EventMessage | EventTreeNode) {
	if ('startTimestamp' in item) {
		return item.startTimestamp;
	}
	return item.timestamp;
}

export function sortEventsByTimestamp(
	eventNodes: Array<EventTreeNode>,
	order: 'desc' | 'asc' = 'desc',
) {
	const copiedEvents = eventNodes.slice();
	copiedEvents.sort((eventA, eventB) => {
		if (order === 'desc') {
			return timestampToNumber(eventB.startTimestamp) - timestampToNumber(eventA.startTimestamp);
		}
		return timestampToNumber(eventA.startTimestamp) - timestampToNumber(eventB.startTimestamp);
	});
	return copiedEvents;
}

export function isEventAction(object: unknown): object is EventAction {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as EventAction).type === ActionType.EVENT_ACTION
	);
}

export function isEventNode(object: unknown): object is EventTreeNode {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as EventTreeNode).type === ActionType.EVENT_TREE_NODE
	);
}

export function isEvent(object: unknown): object is EventTreeNode | EventAction {
	return isEventNode(object) || isEventAction(object);
}

export const isEventId = (str: string): boolean =>
	// eslint-disable-next-line max-len
	/[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}(:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})?/.test(
		str,
	);

export const sortByTimestamp = (
	items: Array<EventMessage | EventTreeNode>,
	order: 'desc' | 'asc' = 'desc',
) => {
	const copiedEvents = items.slice();
	copiedEvents.sort((itemA, itemB) => {
		if (order === 'desc') {
			return getTimestampAsNumber(itemB) - getTimestampAsNumber(itemA);
		}
		return getTimestampAsNumber(itemA) - getTimestampAsNumber(itemB);
	});
	return copiedEvents;
};

export function getItemId(item: EventAction | EventTreeNode | EventMessage) {
	if (isEventMessage(item)) return item.id;
	return item.eventId;
}

export function getItemName(item: EventAction | EventTreeNode | EventMessage) {
	if (isEventMessage(item) && item.parsedMessages) {
		return item.parsedMessages.reduce((previous, current) => {
			return previous + current.message.metadata.messageType.concat(',');
		}, '');
	}
	if (isEventAction(item) || isEventNode(item)) return item.eventName;

	return 'unknown type';
}

export const convertEventActionToEventTreeNode = (event: EventAction): EventTreeNode => ({
	eventId: event.eventId,
	eventName: event.eventName,
	eventType: event.eventType,
	startTimestamp: event.startTimestamp,
	endTimestamp: event.endTimestamp,
	successful: event.successful,
	parentId: event.parentEventId,
	type: ActionType.EVENT_TREE_NODE,
});

export const getErrorEventTreeNode = (eventId: string): EventTreeNode => ({
	type: ActionType.EVENT_TREE_NODE,
	isUnknown: true,
	eventId,
	eventName: eventId,
	eventType: 'eventTreeNode',
	parentId: 'unknown-root',
	startTimestamp: '',
	endTimestamp: '',
	successful: false,
});

export const unknownRoot: EventTreeNode = {
	type: ActionType.EVENT_TREE_NODE,
	isUnknown: true,
	eventId: 'unknown-root',
	eventName: 'Unknown Events',
	eventType: 'eventTreeNode',
	parentId: null,
	startTimestamp: '',
	successful: false,
};
