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

import { EventAction, EventTree } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import MessagesFilter from '../models/filter/MessagesFilter';
import EventsFilter from '../models/filter/EventsFilter';
import { TimeRange } from '../models/Timestamp';
import { SSEParams, SSEFilterInfo } from './sse';

export default interface ApiSchema {
	events: EventApiSchema;
	messages: MessageApiSchema;
	sse: SSESchema;
}

export type SSEChannelType = 'event' | 'message';

export interface EventSourceConfig {
	type: SSEChannelType;
	queryParams: SSEParams;
}

export interface EventApiSchema {
	getEventTree: (filter: EventsFilter, signal?: AbortSignal) => Promise<EventTree>;
	getEvent: (
		id: string,
		abortSignal?: AbortSignal,
		queryParams?: Record<string, string | number | boolean | null | string[]>,
	) => Promise<EventAction>;
	getEventsByName: (timeRange: TimeRange, name: string, eventId?: string) => Promise<string[]>;
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
}

export interface SSESchema {
	getEventSource: (config: EventSourceConfig) => EventSource;
	getFilters: (filterType: 'events' | 'messages') => Promise<string[]>;
	getFiltersInfo: (
		filterType: 'events' | 'messages',
		filters: string[],
	) => Promise<SSEFilterInfo[]>;
}
