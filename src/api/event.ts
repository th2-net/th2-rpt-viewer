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

import { createURLSearchParams } from 'helpers/url';
import { EventApiSchema } from './ApiSchema';

const eventHttpApi: EventApiSchema = {
	getEventTree: async (filter, signal?) => {
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
	getEvent: async (id, signal?, queryParams = {}) => {
		const params = createURLSearchParams(queryParams);
		const res = await fetch(`backend/event/${id}?${params}`, { signal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getEventsByName: async (timeRange, name) => {
		const [timestampFrom, timestampTo] = timeRange;

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
