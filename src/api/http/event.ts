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

const eventHttpApi: EventApiSchema = {
	getAll: async () => {
		const params = new URLSearchParams({ idsOnly: false.toString() });
		const res = await fetch(`/backend/search/events?${params}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getEvent: async (id: string, signal?: AbortSignal) => {
		const res = await fetch(`/backend/event/${id}`, { signal });

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
	getSubNodes: async (id: string, abortSignal?: AbortSignal) => {
		const res = await fetch(`/backend/event/${id}/children`, { signal: abortSignal });

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getSubNodesIds: async (id: string) => {
		const params = new URLSearchParams({ idsOnly: true.toString() });
		const res = await fetch(`/backend/event/${id}/children?${params}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
};

export default eventHttpApi;
