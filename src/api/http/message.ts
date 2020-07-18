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
import { createURLSearchParams } from '../../helpers/url';
import MessagesFilter from '../../models/filter/MessagesFilter';

const messageHttpApi: MessageApiSchema = {
	getAll: async () => {
		const params = createURLSearchParams({ idsOnly: false });
		const res = await fetch(`/backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessages: async ({
		idsOnly = true,
		messageId,
		timelineDirection = 'next',
		limit = 100,
	}, filter: MessagesFilter, abortSignal?: AbortSignal) => {
		const {
			timestampFrom,
			timestampTo,
			streams,
			messageTypes,
		} = filter;

		const params = createURLSearchParams({
			idsOnly,
			timelineDirection,
			messageId,
			limit,
			timestampFrom,
			timestampTo,
		});

		if (streams.length > 0) {
			streams.forEach(s => params.append('stream', s));
		}

		if (messageTypes.length > 0) {
			messageTypes.forEach(type => params.append('messageType', type));
		}

		const res = await fetch(`/backend/search/messages?${params}`, { signal: abortSignal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessagesIds: async (timestampFrom: number, timestampTo: number) => {
		const params = createURLSearchParams({
			idsOnly: true,
			timestampFrom,
			timestampTo,
		});
		const res = await fetch(`/backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessage: async (id: string, signal?: AbortSignal) => {
		const res = await fetch(`/backend/message/${id}`, { signal });

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
	getMessagesByFilter: async ({
		timestampFrom,
		timestampTo,
		streams,
		messageTypes,
	}) => {
		const params = createURLSearchParams({
			timestampFrom,
			timestampTo,
			idsOnly: true,
		});

		if (streams.length > 0) {
			streams.forEach(stream => params.append('stream', stream));
		}

		if (messageTypes.length > 0) {
			messageTypes.forEach(type => params.append('messageType', type));
		}

		const res = await fetch(`backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
};

export default messageHttpApi;
