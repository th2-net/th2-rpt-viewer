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

import { MessageApiSchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import MessagesFilter from '../models/filter/MessagesFilter';
import { MessagesSSEParams } from './sse';

export type MatchMessageParams = Omit<
	MessagesSSEParams,
	'resultCountLimit' | 'resumeFromId' | 'searchDirection'
>;

const messageHttpApi: MessageApiSchema = {
	getAll: async () => {
		const params = createURLSearchParams({ idsOnly: false });
		const res = await fetch(`backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessages: async (
		search: {
			limit: number;
			timelineDirection: 'previous' | 'next';
			messageId: string;
			idsOnly: boolean;
		},
		filter: MessagesFilter,
		abortSignal?: AbortSignal,
	) => {
		const { idsOnly = true, messageId = '', timelineDirection = 'next', limit = 100 } = search;
		const { streams, timestampFrom, timestampTo } = filter;

		const params = createURLSearchParams({
			idsOnly,
			timelineDirection,
			messageId: messageId.length > 0 ? messageId : null,
			limit,
			timestampFrom,
			timestampTo,
			stream: streams,
		});

		const res = await fetch(`backend/search/messages?${params}`, {
			signal: abortSignal,
		});

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);

		throw res;
	},
	getMessagesIds: async (timestampFrom, timestampTo) => {
		const params = createURLSearchParams({
			idsOnly: true,
			timestampFrom,
			timestampTo,
		});
		const res = await fetch(`backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessage: async (id, signal?, queryParams = {}) => {
		const params = createURLSearchParams(queryParams);
		const res = await fetch(`backend/message/${id}?${params}`, {
			signal,
		});

		// if probe param is provided server will respond with empty body if messsage wasn't found
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
	getMessageSessions: async book => {
		const res = await fetch(`backend/messageStreams?bookId=${book}`);

		if (res.ok) return res.json();

		console.error(res.statusText);
		return [];
	},
	matchMessage: async (messageId: string, filter: MatchMessageParams, signal?: AbortSignal) => {
		const params = createURLSearchParams({ ...filter });
		const res = await fetch(`backend/match/message/${messageId}?${params}`, {
			signal,
		});

		if (res.ok) return res.json();

		console.error(res.statusText);
		return [];
	},
};

export default messageHttpApi;
