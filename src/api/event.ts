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

import { EventApiSchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import { EventTreeNode } from '../models/EventAction';

const eventHttpApi: EventApiSchema = {
	getEventTree: async filter => {
		if (!filter?.timestampFrom || !filter.timestampTo) {
			throw new Error('timestamps are required to fetch events');
		}

		const params = createURLSearchParams({
			timestampFrom: filter.timestampFrom,
			timestampTo: filter.timestampTo,
		});

		if (filter.names.length > 0) {
			filter.names.forEach(name => params.append('name', name));
		}
		if (filter.eventTypes.length > 0) {
			filter.eventTypes.forEach(type => params.append('eventType', type));
		}

		const res = await fetch(`/backend/search/events?${params}`);

		if (res.ok) {
			return res.json();
		}
		console.error(res.statusText);

		throw new Error('Couldn\'t fetch event tree');
	},
	getEvent: async (id, signal?) => {
		const res = await fetch(`/backend/event/${id}`, { signal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getEventsByName: async (timestampFrom, timestampTo, name, eventId) => {
		const params = createURLSearchParams({
			name,
			timestampFrom,
			timestampTo,
		});

		const path = eventId == null
			? `/backend/rootEvents?${params}`
			: `/backend/search/events/${eventId}?${params}`;
		const res = await fetch(path);

		if (res.ok) {
			if (eventId) {
				const flattenEventTreeNodes = (e: EventTreeNode): string[] =>
					[e.eventId, ...e.childList.flatMap(flattenEventTreeNodes)];
				const events: Array<EventTreeNode> = await res.json();

				return events.flatMap(flattenEventTreeNodes);
			}
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
};

export default eventHttpApi;
