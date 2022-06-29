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

import { EventTreeNode } from './EventAction';
import { EventMessage } from './EventMessage';
import { TimeRange } from './Timestamp';

export const intervalOptions = [15, 30, 60] as const;

export type IntervalOption = typeof intervalOptions[number];

export interface Chunk {
	from: number;
	to: number;
	data: Array<ChunkData>;
}

export interface ChunkData {
	timestamp: number;
	events: number;
	passed: number;
	failed: number;
	messages: number;
}

export interface IntervalData {
	events: number;
	passed: number;
	failed: number;
	messages: number;
	connected: number;
}

export interface GraphGroup {
	items: GraphItem[];
	left: number;
}

export type GraphItem = EventMessage | EventTreeNode;

export enum GraphItemType {
	ATTACHED_MESSAGE = 'attached-message',
	PINNED_MESSAGE = 'pinned-message',
	PASSED = 'passed',
	FAILED = 'failed',
	BOOKMARKED_FAILED = 'bookmarked-failed',
	BOOKMARKED_PASSED = 'bookmarked-passed',
	HOVERED_EVENT = 'hovered-event',
	HOVERED_EVENT_PASSED = 'hovered-event-passed',
	HOVERED_EVENT_FAILED = 'hovered-event-failed',
	HOVERED_MESSAGE = 'hovered-message',
}

export interface PanelRange {
	type: GraphPanelType;
	range: TimeRange;
	setRange: (timestamp: number) => void;
}

export interface PanelsRangeMarker {
	type: string;
	left: number;
	width: number;
}

export type GraphPanelType = 'events-panel' | 'messages-panel';
