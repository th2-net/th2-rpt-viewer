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

const messageHttpApi: MessageApiSchema = {
	getAll: async () => {
		const params = new URLSearchParams({ idsOnly: false } as any);
		const res = await fetch(`/backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessages: async (timestampFrom: number, timestampTo: number) => {
		const params = new URLSearchParams({
			idsOnly: false,
			timestampFrom,
			timestampTo,
		} as any);
		const res = await fetch(`/backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessagesIds: async (timestampFrom: number, timestampTo: number) => {
		const params = new URLSearchParams({
			idsOnly: true,
			timestampFrom,
			timestampTo,
		} as any);
		const res = await fetch(`/backend/search/messages?${params}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return [];
	},
	getMessage: async (id: string) => {
		const res = await fetch(`/backend/message/${id}`);

		if (res.ok) {
			return res.json();
		}

		console.error(res.statusText);
		return null;
	},
};

export default messageHttpApi;
