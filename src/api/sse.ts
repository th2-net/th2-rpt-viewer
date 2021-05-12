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

import moment from 'moment';
import { SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import EventsFilter from '../models/filter/EventsFilter';
import { getObjectKeys } from '../helpers/object';
import { MessageFilterState } from '../components/search-panel/SearchPanelFilters';

interface BaseSSEParams {
	startTimestamp: number;
	endTimestamp?: number | null;
	resultCountLimit?: number;
	resumeFromId?: string;
	searchDirection?: 'next' | 'previous'; // defaults to next
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
}

export interface SSEParamsEvents {
	parentEvent?: string;
	resultCountLimit?: number;
	resumeFromId?: string;
	searchDirection?: 'next' | 'previous'; // defaults to next
	limitForParent?: number;
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

			return {
				...params,
				...currentFilterParams,
			};
		},
		{ filters },
	);
}

export function getMessagesSSEParamsFromFilter(
	filter: MessageFilterState | null,
	streams: string[],
	startTimestamp: number | null,
	endTimestamp: number | null = null,
	searchDirection = 'previous',
	resultCountLimit?: number,
): URLSearchParams {
	const filtersToAdd: Array<keyof MessageFilterState> = !filter
		? []
		: Object.entries(filter)
				.filter(([_, filterValues]) => filterValues.values.length > 0)
				.map(([filterName]) => filterName as keyof MessageFilterState);

	const filterValues = filtersToAdd
		.map(filterName => (filter ? [`${filterName}-values`, filter[filterName].values] : []))
		.filter(Boolean);

	const filterInclusion = filtersToAdd.map(filterName =>
		filter && filter[filterName].negative
			? [`${filterName}-negative`, filter[filterName].negative]
			: [],
	);

	const timestampTo = moment().utc().subtract(30, 'minutes').valueOf();
	const defaultStartTimestamp = moment(timestampTo).add(5, 'minutes').valueOf();

	const queryParams: MessagesSSEParams = {
		startTimestamp: startTimestamp || defaultStartTimestamp,
		endTimestamp: endTimestamp || undefined,
		stream: streams,
		searchDirection,
		resultCountLimit,
		filters: filtersToAdd,
		...Object.fromEntries([...filterValues, ...filterInclusion]),
	};

	return createURLSearchParams({ ...queryParams });
}

const sseApi: SSESchema = {
	getEventSource: config => {
		const { type, queryParams } = config;
		const params = createURLSearchParams({ ...queryParams });
		return new EventSource(`backend/search/sse/${type}s/?${params}`);
	},
	getEventsTreeSource: (timeRange, filter, sseParams) => {
		const paramFromFilter = filter ? getEventsSSEParamsFromFilter(filter) : {};
		const params = createURLSearchParams({
			...{
				startTimestamp: timeRange[0],
				endTimestamp: timeRange[1],
				...paramFromFilter,
				...sseParams,
			},
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
	getEventFilters: () => {
		return sseApi.getFilters<EventSSEFilters>('events');
	},
	getMessagesFilters: () => {
		return sseApi.getFilters<MessagesSSEFilters>('messages');
	},
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
				fetch(`backend/filters/sse-messages/${filterName}`).then(res => res.json()),
			),
		);
	},
};

export default sseApi;
