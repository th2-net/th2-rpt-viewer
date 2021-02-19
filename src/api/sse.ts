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

import { EventSourceConfig, SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';

interface BaseSSEParams {
	startTimestamp: number;
	searchDirection?: 'next' | 'previous'; // defaults to next
	resultCountLimit?: number;
	endTimestamp?: number | null;
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
	type: { value: 'string' | 'boolean' | 'string[]' };
}

type EventSSEFilters = 'attachedMessageId' | 'type' | 'name';
type MessagesSSEFilters = 'attachedEventIds' | 'type' | 'body';

interface EventSSEParams extends BaseSSEParams {
	parentEvent?: string;
	filters: Array<EventSSEFilters>;
	'attachedMessageId-values'?: string;
	'attachedMessageId-negative'?: boolean;
	'type-values'?: string[];
	'type-negative'?: boolean;
	'name-values'?: string[];
	'name-negative'?: boolean;
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
	getEventSource(config: EventSourceConfig) {
		const { type, queryParams } = config;
		const params = createURLSearchParams({ ...queryParams });
		return new EventSource(`backend/search/sse/${type}s/?${params}`);
	},
	getFilters: async (filterType: 'events' | 'messages'): Promise<string[]> => {
		const res = await fetch(`backend/filters/sse-${filterType}`);
		if (res.ok) {
			return res.json();
		}

		throw res;
	},
	getFiltersInfo: (
		filterType: 'events' | 'messages',
		filters: string[],
	): Promise<SSEFilterInfo[]> => {
		return Promise.all(
			filters.map(filterName =>
				fetch(`backend/filters/sse-${filterType}/${filterName}`).then(res => res.json()),
			),
		);
	},
};

export default sseApi;
