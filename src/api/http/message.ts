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
import { MessageApiSchema } from '../ApiSchema';
import { EventMessageTimeStamp } from '../../models/EventMessage';

// const BASE_URL = '/api';

const BASE_URL = 'http://th2-kuber-node03:30000/backend';

/* eslint-disable no-return-await */
const messageHttpApi: MessageApiSchema = {
	getAll: async () => {
		const params = new URLSearchParams({ idsOnly: false } as any);
		const res = await fetch(`${BASE_URL}/search/messages?${params}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessages: async (timestampFrom: EventMessageTimeStamp, timestampTo: EventMessageTimeStamp) => {
		const params = new URLSearchParams({
			idsOnly: false,
			// timestampFrom: timestampFrom ? new Date(timestampFrom * 1000 ).toISOString() : null,
			// timestampTo: timestampTo ? new Date(timestampTo * 1000).toISOString() : null,
			timestampFrom: timestampFrom.epochSecond * 1000 + timestampFrom.nano / 1_000_000,
			timestampTo: timestampTo.epochSecond * 1000 + timestampTo.nano / 1_000_000,
		} as any);
		const res = await fetch(`${BASE_URL}/search/messages?${params}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessage: async (id: string) => {
		const res = await fetch(`${BASE_URL}/messages/${id}`);

		if (res.ok) {
			return await res.json();
		}

		console.error(res.statusText);
		return null;
	},
};

export default messageHttpApi;
