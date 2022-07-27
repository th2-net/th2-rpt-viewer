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
import { EventAction } from '../models/EventAction';

const eventHttpApi: EventApiSchema = {
	getEvent: async (id, signal?, queryParams = {}) => {
		const params = createURLSearchParams(queryParams);
		const res = await fetch(`backend/event/${id}?${params}`, {
			signal,
		});

		// if probe param is provided server will respond with empty body if event wasn't found
		if (res.ok && queryParams.probe) {
			const body = await res.text();
			return body ? JSON.parse(body) : null;
		}

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getEventParents: async (firstParentId: string, abortSignal?: AbortSignal) => {
		let currentParentId: string | null = firstParentId;
		let currentParentEvent = null;
		const path: EventAction[] = [];

		try {
			while (typeof currentParentId === 'string' && currentParentId !== 'null') {
				// eslint-disable-next-line no-await-in-loop
				currentParentEvent = await eventHttpApi.getEvent(currentParentId, abortSignal, {
					probe: true,
				});
				if (currentParentEvent) {
					path.unshift(currentParentEvent);
				}
				currentParentId = currentParentEvent.parentEventId;
			}

			return path;
		} catch (error) {
			return path;
		}
	},
};

export default eventHttpApi;
