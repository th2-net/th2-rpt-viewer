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

const eventHttpApi: EventApiSchema = {
	getEventTree: async (filter, signal?) => {
		if (!filter.timestampFrom || !filter.timestampTo) {
			throw new Error('timestamps are required to fetch events');
		}

		const params = createURLSearchParams({
			timestampFrom: filter.timestampFrom,
			timestampTo: filter.timestampTo,
			name: filter.names,
			type: filter.eventTypes,
		});

		const res = await fetch(`backend/search/events?${params}`, { signal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);

		throw res;
	},
	getEvent: async (id, signal?) => {
		const res = await fetch(`backend/event/${id}`, { signal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getEventsByName: async (timestampFrom, timestampTo, name) => {
		const params = createURLSearchParams({
			name,
			timestampFrom,
			timestampTo,
			flat: true,
		});

		const path = `backend/search/events?${params}`;
		const res = await fetch(path);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
};

export default eventHttpApi;
