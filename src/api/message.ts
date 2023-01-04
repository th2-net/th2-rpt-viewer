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
import { MessagesSSEParams } from './sse';
import fetch from '../helpers/fetchRetry';

export type MatchMessageParams = Omit<
	MessagesSSEParams,
	'resultCountLimit' | 'resumeFromId' | 'searchDirection'
>;

const messageHttpApi: MessageApiSchema = {
	getMessage: async (id, signal?, queryParams = {}) => {
		const params = createURLSearchParams(queryParams);
		const res = await fetch(`${process.env.BASE_URL}/message/${id}?${params}`, {
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
	getMessageSessions: async () => {
		const res = await fetch(`${process.env.BASE_URL}/messageStreams`);

		if (res.ok) return res.json();

		console.error(res.statusText);
		return [];
	},
	matchMessage: async (messageId: string, filter: MatchMessageParams, signal?: AbortSignal) => {
		const params = createURLSearchParams({ ...filter });
		const res = await fetch(`${process.env.BASE_URL}/match/message/${messageId}?${params}`, {
			signal,
		});

		if (res.ok) return res.json();

		console.error(res.statusText);
		return [];
	},
	getResumptionMessageIds: async ({ streams, startTimestamp, messageId }, signal) => {
		if (!startTimestamp && !messageId) {
			throw new Error('One of startTimestamp or messageId must be specified');
		}

		const params = createURLSearchParams({
			stream: streams,
			startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : startTimestamp,
			messageId,
		});
		const res = await fetch(`${process.env.BASE_URL}/messageIds/?${params}`, {
			signal,
		});
		if (res.ok) return res.json();

		console.error(res.statusText);
		return [];
	},
};

export default messageHttpApi;
