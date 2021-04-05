/** *****************************************************************************
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

import { Timestamp } from './Timestamp';
import { EventBodyPayload } from './EventActionPayload';

export type EventTree = Array<EventTreeNode>;

export enum ActionType {
	EVENT_ACTION = 'event',
	EVENT_TREE_NODE = 'eventTreeNode',
	MESSAGE = 'message',
}

interface EventBase {
	eventId: string;
	eventName: string;
	eventType: string;
	startTimestamp: Timestamp;
	endTimestamp?: Timestamp | null;
	successful: boolean;
}

export interface EventTreeNode extends EventBase {
	childList: Array<EventTreeNode>;
	filtered: boolean;
	parentId: string | null;
	type: ActionType.EVENT_TREE_NODE;
	isUnknown?: boolean;
}

export interface EventAction extends EventBase {
	attachedMessageIds: Array<string>;
	isBatched: boolean;
	batchId: null | string;
	batched: boolean;
	body: EventActionBody;
	parentEventId: string;
	type: ActionType.EVENT_ACTION;
}

export type EventActionBody = EventBodyPayload[];
