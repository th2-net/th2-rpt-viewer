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

import MessagesFilter from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import { getObjectKeys } from '../helpers/object';
import { SearchDirection } from '../models/SearchDirection';

interface BaseSSEParams {
	startTimestamp?: number;
	endTimestamp?: number | null;
	resultCountLimit?: number;
	searchDirection?: 'next' | 'previous'; // defaults to next
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
	| 'event_generic';

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
	resumeFromId?: string;
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
}

export interface SSEParamsEvents {
	parentEvent?: string;
	resultCountLimit?: number;
	resumeFromId?: string;
	searchDirection?: 'next' | 'previous'; // defaults to next
	limitForParent?: number;
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

export type SSEParams = EventSSEParams | MessagesSSEParams;

type ParamsFromFilter = Record<string, string | string[] | boolean>;

function getEventsSSEParamsFromFilter(filter: EventsFilter): ParamsFromFilter {
	const filters = getObjectKeys(filter).filter(filterName =>
		filterName === 'status'
			? filter[filterName].values !== 'any'
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
		{ filters },
	);
}

export function getMessagesSSEParamsFromFilter(
	filter: MessagesFilter | null,
	streams: string[],
	startTimestamp: number | null,
	endTimestamp: number | null,
	searchDirection: SearchDirection,
	resultCountLimit?: number,
): URLSearchParams {
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

	const queryParams: MessagesSSEParams = {
		startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : startTimestamp,
		endTimestamp: endTimestamp ? new Date(endTimestamp).toISOString() : endTimestamp,
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

	return createURLSearchParams({ ...queryParams });
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
	getEventsTreeSource: (timeRange, filter, sseParams) => {
		const paramFromFilter = filter ? getEventsSSEParamsFromFilter(filter) : {};
		const params = createURLSearchParams({
			startTimestamp: new Date(timeRange[0]).toISOString(),
			endTimestamp: new Date(timeRange[1]).toISOString(),
			...paramFromFilter,
			...sseParams,
		});
		return new EventSource(`backend/search/sse/events/?${params}`);
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
						defaultValue: 'any',
						hint: 'passed, failed, any',
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
