/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

/* eslint-disable no-return-await */
import { EventApiSchema } from '../ApiSchema';
import { createURLSearchParams } from '../../helpers/url';

const eventHttpApi: EventApiSchema = {
	getRootEvents: async filter => {
		if (filter) {
			const from = filter.timestampFrom;
			const to = filter.timestampTo;
			const params = createURLSearchParams({
				from,
				to,
				idsOnly: true,
			});

			if (filter.names.length > 0) {
				filter.names.forEach(name => params.append('name', name));
			}
			if (filter.eventTypes.length > 0) {
				filter.eventTypes.forEach(type => params.append('eventType', type));
			}
			const res = await fetch(`/backend/rootEvents?${params}`);
			if (res.ok) {
				return await res.json();
			}
			console.error(res.statusText);
		}
		return [];
	},
	getEvent: async (id: string, parentIds: string[], signal?: AbortSignal) => {
		const res = await fetch(`/backend/event/${[...parentIds, id].join('/')}`, { signal });

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getRange: async (start, end) => {
		const res = await fetch(`/backend/event?start=${start},end=${end}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getEventsByName: async (name, eventId) => {
		const params = createURLSearchParams({
			idsOnly: true,
			name,
		});

		const path = eventId == null
			? `/backend/search/events?${params}`
			: `/backend/search/events/${eventId}?${params}`;
		const res = await fetch(path);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
};

export default eventHttpApi;
