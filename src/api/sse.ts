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

import MessagesFilter, { MessagesParams } from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import { getObjectKeys } from '../helpers/object';
import { SearchDirection } from '../models/SearchDirection';
import fetch from '../helpers/fetchRetry';

interface BaseSSEParams {
	startTimestamp?: number;
	endTimestamp?: number | null;
	resultCountLimit?: number;
	searchDirection?: SearchDirection.Next | SearchDirection.Previous; // defaults to next
}

export interface SSEHeartbeat {
	id: string;
	timestamp: number;
	scanCounter: number;
}

export type SSEFilterInfo = EventsFiltersInfo | MessagesFilterInfo;

export interface SSEFilterParameter {
	defaultValue: boolean | string | string[] | null;
	hint: string;
	name: 'conjunct' | 'negative' | 'strict' | 'values';
	type: { value: 'string' | 'boolean' | 'string[]' | 'switcher' };
}

export type EventFilterKeys =
	| 'attachedMessageId'
	| 'type'
	| 'name'
	| 'body'
	| 'status'
	| 'event_generic'
	| 'text'
	| 'parentId';

export type MessageFilterKeys =
	| 'attachedEventIds'
	| 'type'
	| 'body'
	| 'bodyBinary'
	| 'message_generic';

export type FilterKeys = EventFilterKeys | MessageFilterKeys;

export interface EventsFiltersInfo {
	name: EventFilterKeys;
	hint: string;
	parameters: SSEFilterParameter[];
}

export interface MessagesFilterInfo {
	name: MessageFilterKeys;
	hint: string;
	parameters: SSEFilterParameter[];
}

export interface EventSSEParams extends BaseSSEParams {
	parentEvent?: string;
	filters?: Array<EventFilterKeys>;
	resumeFromId?: string;
	resultCountLimit?: number;
	limitForParent?: number;
	metadataOnly?: boolean;

	'attachedMessageId-values'?: string;
	'attachedMessageId-negative'?: boolean;
	'attachedMessageId-conjunct'?: boolean;
	'attachedMessageId-strict'?: boolean;
	'type-values'?: string[];
	'type-negative'?: boolean;
	'type-conjunct'?: boolean;
	'type-strict'?: boolean;
	'name-values'?: string[];
	'name-negative'?: boolean;
	'name-conjunct'?: boolean;
	'name-strict'?: boolean;
}

export type MessageDirection = 'first' | 'second';

export const toStream = (
	name: string,
	direction: MessageDirection[] = ['first', 'second'],
): string[] => direction.map(dir => `${name}:${dir}`);

export interface MessagesSSEParams extends BaseSSEParams {
	stream: string[];
	filters?: Array<MessageFilterKeys>;
	'attachedEventIds-values'?: string[];
	'attachedEventIds-negative'?: boolean;
	'attachedEventIds-conjunct'?: boolean;
	'attachedEventIds-strict'?: boolean;
	'type-values'?: string[];
	'type-negative'?: boolean;
	'type-conjunct'?: boolean;
	'type-strict'?: boolean;
	'body-values'?: string[];
	'body-negative'?: boolean;
	'body-conjunct'?: boolean;
	'body-strict'?: boolean;
	messageId?: string[];
	resumeFromId?: string;
}

export interface MessageIdsEvent {
	reason: string;
	// session: messageId
	messageIds: {
		[session: string]: {
			hasStarted: boolean;
			hasFinished: boolean;
			lastId: string | null;
		};
	};
}

type ParamsFromFilter = Record<string, string | string[] | boolean>;

export function getParamsFromFilter(filter: EventsFilter): EventSSEParams {
	const filters = getObjectKeys(filter).filter(filterName =>
		filterName === 'status'
			? filter[filterName].values !== 'All'
			: filter[filterName].values.length > 0,
	);

	return filters.reduce(
		(params, filterName) => {
			const currentFilter = filter[filterName];
			const currentFilterParams: ParamsFromFilter = {};

			currentFilterParams[`${filterName}-${filterName === 'status' ? 'value' : 'values'}`] =
				currentFilter.values;
			if ('negative' in currentFilter) {
				currentFilterParams[`${filterName}-negative`] = currentFilter.negative;
			}
			if ('conjunct' in currentFilter) {
				currentFilterParams[`${filterName}-conjunct`] = currentFilter.conjunct;
			}
			if ('strict' in currentFilter) {
				currentFilterParams[`${filterName}-strict`] = currentFilter.strict;
			}

			return {
				...params,
				...currentFilterParams,
			};
		},
		{
			filters,
		},
	);
}

interface EventParams {
	filter: EventsFilter | null;
	startTimestamp: number;
	endTimestamp?: number;
	searchDirection: SearchDirection.Next | SearchDirection.Previous;
	resultCountLimit?: number;
	metadataOnly?: boolean;
	parentEvent?: string;
	resumeFromId?: string;
}

export function getEventsSSEParams(params: EventParams): EventSSEParams {
	const { filter, ...restParams } = params;
	const filters = filter ? getParamsFromFilter(filter) : {};

	return {
		...restParams,
		...filters,
	};
}

interface MessageParams {
	filter: MessagesFilter | null;
	params: MessagesParams;
	searchDirection: SearchDirection;
	resultCountLimit?: number;
}

export function getMessagesSSEParams(searchParams: MessageParams): MessagesSSEParams {
	const { filter, params, searchDirection, resultCountLimit } = searchParams;
	const filtersToAdd: Array<keyof MessagesFilter> = !filter
		? []
		: Object.entries(filter)
				.filter(([_, filterValues]) => filterValues.values.length > 0)
				.map(([filterName]) => filterName as keyof MessagesFilter);

	const filterValues = filtersToAdd
		.map(filterName => (filter ? [`${filterName}-values`, filter[filterName].values] : []))
		.filter(Boolean);

	const filterInclusion = filtersToAdd.map(filterName =>
		filter && filter[filterName].negative
			? [`${filterName}-negative`, filter[filterName].negative]
			: [],
	);

	const filterConjunct = filtersToAdd.map(filterName =>
		filter && filter[filterName].conjunct
			? [`${filterName}-conjunct`, filter[filterName].conjunct]
			: [],
	);

	const filterStrict = filtersToAdd.map(filterName =>
		filter && filter[filterName].strict ? [`${filterName}-strict`, filter[filterName].strict] : [],
	);

	const { streams, startTimestamp, endTimestamp } = params;

	const queryParams: MessagesSSEParams = {
		startTimestamp: startTimestamp && new Date(startTimestamp).toISOString(),
		endTimestamp: endTimestamp && new Date(endTimestamp).toISOString(),
		stream: streams.flatMap(stream => [`${stream}:first`, `${stream}:second`]),
		searchDirection,
		resultCountLimit,
		filters: filtersToAdd,
		...Object.fromEntries([
			...filterValues,
			...filterInclusion,
			...filterConjunct,
			...filterStrict,
		]),
	};

	return queryParams;
}

const sseApi: SSESchema = {
	getEventSource: config => {
		const { type, queryParams } = config;
		const params = createURLSearchParams({
			...queryParams,
			startTimestamp: queryParams.startTimestamp
				? new Date(queryParams.startTimestamp).toISOString()
				: null,
			endTimestamp: queryParams.endTimestamp
				? new Date(queryParams.endTimestamp).toISOString()
				: null,
		});
		return new EventSource(`backend/search/sse/${type}s/?${params}`);
	},
	getFilters: async <T>(filterType: 'events' | 'messages'): Promise<T[]> => {
		const res = await fetch(`backend/filters/sse-${filterType}`);
		if (res.ok) {
			return res.json();
		}

		throw res;
	},
	getEventFilters: () => sseApi.getFilters<EventFilterKeys>('events'),
	getMessagesFilters: () => sseApi.getFilters<MessageFilterKeys>('messages'),
	getEventsFiltersInfo: async filters => {
		const eventFilterInfo = await Promise.all<EventsFiltersInfo>(
			filters.map(filterName =>
				fetch(`backend/filters/sse-events/${filterName}`).then(res => res.json()),
			),
		);

		return eventFilterInfo.map(filterInfo => {
			if (filterInfo.name === 'status') {
				// eslint-disable-next-line no-param-reassign
				filterInfo.parameters = [
					{
						type: { value: 'switcher' },
						name: 'values',
						defaultValue: 'All',
						hint: 'passed, failed, all',
					},
				];
			}

			return filterInfo;
		});
	},
	getMessagesFiltersInfo: filters =>
		Promise.all(
			filters.map(filterName =>
				fetch(`backend/filters/sse-messages/${filterName}`).then(res => res.json()),
			),
		),
};

export default sseApi;
