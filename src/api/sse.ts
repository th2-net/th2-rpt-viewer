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

import { EventSourceConfig, SSESchema } from './ApiSchema';
import { createURLSearchParams } from '../helpers/url';
import { SSEFilterInfo } from '../stores/SearchPanelFiltersStore';

const sseApi: SSESchema = {
	getEventSource(config: EventSourceConfig) {
		const { type, queryParams, listener, onOpen, onClose } = config;
		const params = createURLSearchParams(queryParams);
		const channel = new EventSource(`backend/search/sse/${type}s/?${params}`);
		channel.addEventListener(type, listener);
		channel.addEventListener('close', () => {
			channel.close();
			onClose();
		});
		channel.addEventListener('open', onOpen);
		return channel;
	},
	async getFilters(filterType: 'events' | 'messages'): Promise<[string, Promise<[string]>]> {
		const res = await fetch(`backend/filters/sse-${filterType}`);
		return [filterType, res.json()];
	},
	async getFiltersInfo(args: [string, Promise<[string]>]): Promise<SSEFilterInfo[]> {
		const [filterType, filters] = args;
		const filterInfos = (await filters).map(async (filterName: string) => {
			const res = await fetch(`backend/filters/sse-${filterType}/${filterName}`);
			return res.json();
		});
		return Promise.all(filterInfos);
	},
};

export default sseApi;
