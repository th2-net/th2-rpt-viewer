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

import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import EventsFilter from '../models/filter/EventsFilter';
import MessagesFilter from '../models/filter/MessagesFilter';
import { TimeRange } from '../models/Timestamp';
import {
	SSEParamsEvents,
	EventsFiltersInfo,
	EventSSEFilters,
	MessagesFilterInfo,
	MessagesSSEFilters,
	SSEParams,
} from './sse';
import { IndexedDB } from './indexedDb';
import { MatchMessageParams } from './message';
import { DirectionalStreamInfo } from '../models/StreamInfo';

export default interface ApiSchema {
	events: EventApiSchema;
	messages: MessageApiSchema;
	sse: SSESchema;
	indexedDb: IndexedDB;
}

export type SSEChannelType = 'event' | 'message';

export interface EventSourceConfig {
	type: SSEChannelType;
	queryParams: SSEParams;
}

export interface EventApiSchema {
	getChildrenIds: (
		params: {
			limit?: number;
			parentId?: string;
			probe?: boolean;
		},
		signal?: AbortSignal,
	) => Promise<string[]>;
	getEvent: (
		id: string,
		abortSignal?: AbortSignal,
		queryParams?: Record<string, string | number | boolean | null | string[]>,
	) => Promise<EventAction>;
	getEventParents: (parentId: string, abortSignal?: AbortSignal) => Promise<EventAction[]>;
}

export interface MessageApiSchema {
	getAll: () => Promise<number[]>;
	getMessagesIds: (timestampFrom: number, timestampTo: number) => Promise<string[]>;
	getMessages(
		search: {
			limit: number;
			timelineDirection: 'previous' | 'next';
			messageId: string;
			idsOnly: true;
		},
		filter: MessagesFilter,
		abortSignal?: AbortSignal,
	): Promise<string[]>;
	getMessages(
		search: {
			limit: number;
			timelineDirection: 'previous' | 'next';
			messageId: string;
			idsOnly: false;
		},
		filter: MessagesFilter,
		abortSignal?: AbortSignal,
	): Promise<EventMessage[]>;
	getMessage: (
		id: string,
		signal?: AbortSignal,
		queryParams?: Record<string, string | number | boolean | null | string[]>,
	) => Promise<EventMessage>;
	getMessageSessions: () => Promise<string[]>;
	matchMessage: (
		messageId: string,
		filter: MatchMessageParams,
		abortSignal?: AbortSignal,
	) => Promise<boolean>;
	getResumptionMessageIds: (params: {
		streams: string[];
		startTimestamp?: number;
		messageId?: string;
		abortSignal?: AbortSignal;
	}) => Promise<DirectionalStreamInfo>;
}

export interface SSESchema {
	getEventSource: (config: EventSourceConfig) => EventSource;
	getEventsTreeSource: (
		timeRange: TimeRange,
		filter: EventsFilter | null,
		sseParams: SSEParamsEvents,
	) => EventSource;
	getFilters: <T>(filterType: 'events' | 'messages') => Promise<T[]>;
	getEventFilters: () => Promise<EventSSEFilters[]>;
	getMessagesFilters: () => Promise<MessagesSSEFilters[]>;
	getEventsFiltersInfo: (filters: EventSSEFilters[]) => Promise<EventsFiltersInfo[]>;
	getMessagesFiltersInfo: (filters: MessagesSSEFilters[]) => Promise<MessagesFilterInfo[]>;
}
