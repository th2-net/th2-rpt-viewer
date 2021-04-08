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

import { SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';

interface BaseSSEParams {
	startTimestamp: number;
	searchDirection?: 'next' | 'previous'; // defaults to next
	resultCountLimit?: number;
	endTimestamp?: number | null;
}

export interface SSEHeartbeat {
	id: string;
	timestamp: number;
	scanCounter: number;
}

export interface SSEFilterInfo {
	name: any;
	hint: string;
	parameters: SSEFilterParameter[];
}

export interface SSEFilterParameter {
	defaultValue: boolean | string | string[] | null;
	hint: string;
	name: string;
	type: { value: 'string' | 'boolean' | 'string[]' | 'switcher' };
}

export type EventSSEFilters = 'attachedMessageId' | 'type' | 'name' | 'body' | 'status';
export type MessagesSSEFilters = 'attachedEventIds' | 'type' | 'body';

export interface EventsFiltersInfo {
	name: EventSSEFilters;
	hint: string;
	parameters: SSEFilterParameter[];
}

export interface MessagesFilterInfo {
	name: MessagesSSEFilters;
	hint: string;
	parameters: SSEFilterParameter[];
}

export interface EventSSEParams extends BaseSSEParams {
	parentEvent?: string;
	filters?: Array<EventSSEFilters>;
	'attachedMessageId-values'?: string;
	'attachedMessageId-negative'?: boolean;
	'type-values'?: string[];
	'type-negative'?: boolean;
	'name-values'?: string[];
	'name-negative'?: boolean;
	resumeFromId?: string;
}

export interface MessagesSSEParams extends BaseSSEParams {
	stream: string[];
	filters?: Array<MessagesSSEFilters>;
	'attachedEventIds-values'?: string[];
	'attachedEventIds-negative'?: boolean;
	'type-values'?: string[];
	'type-negative'?: boolean;
	'body-values'?: string[];
	'body-negative'?: boolean;
	resumeFromId?: string;
}

export type SSEParams = EventSSEParams | MessagesSSEParams;

const sseApi: SSESchema = {
	getEventSource: config => {
		const { type, queryParams } = config;
		const params = createURLSearchParams({ ...queryParams });
		return new EventSource(
			`http://th2-qa:30000/schema-schema-qa/backend/search/sse/${type}s/?${params}`,
		);
	},
	getFilters: async <T>(filterType: 'events' | 'messages'): Promise<T[]> => {
		const res = await fetch(
			`http://th2-qa:30000/schema-schema-qa/backend/filters/sse-${filterType}`,
		);
		if (res.ok) {
			return res.json();
		}

		throw res;
	},
	getEventFilters: () => {
		return sseApi.getFilters<EventSSEFilters>('events');
	},
	getMessagesFilters: () => {
		return sseApi.getFilters<MessagesSSEFilters>('messages');
	},
	getEventsFiltersInfo: async filters => {
		const eventFilterInfo = await Promise.all<EventsFiltersInfo>(
			filters.map(filterName =>
				fetch(
					`http://th2-qa:30000/schema-schema-qa/backend/filters/sse-events/${filterName}`,
				).then(res => res.json()),
			),
		);

		return eventFilterInfo.map(filterInfo => {
			if (filterInfo.name === 'status') {
				// eslint-disable-next-line no-param-reassign
				filterInfo.parameters = [
					{
						type: { value: 'switcher' },
						name: 'value',
						defaultValue: 'any',
						hint: 'passed, failed, any',
					},
				];
			}

			return filterInfo;
		});
	},
	getMessagesFiltersInfo: filters => {
		return Promise.all(
			filters.map(filterName =>
				fetch(
					`http://th2-qa:30000/schema-schema-qa/backend/filters/sse-messages/${filterName}`,
				).then(res => res.json()),
			),
		);
	},
};

export default sseApi;
