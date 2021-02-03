/** ****************************************************************************
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

import { action, observable, runInAction } from 'mobx';
import sseApi from '../api/sse';

export interface SSEFilterParameter {
	defaultValue: boolean | string | string[] | null;
	hint: string;
	name: string;
	type: { value: 'string' | 'boolean' | 'string[]' };
}

export interface SSEFilterInfo {
	name: any;
	hint: string;
	parameters: SSEFilterParameter[];
}

export class SearchPanelFiltersStore {
	constructor() {
		this.getEventFilters();
		this.getMessagesFilters();
	}

	@observable eventFilterInfo: SSEFilterInfo[] = [];

	@observable messagesFilterInfo: SSEFilterInfo[] = [];

	@action
	getEventFilters = async () => {
		try {
			const filters = await sseApi.getFilters('events');
			const filtersInfo = await sseApi.getFiltersInfo('events', filters);
			runInAction(() => {
				this.eventFilterInfo = filtersInfo;
			});
		} catch (error) {
			console.error('Error occured while loading event filters', error);
		}
	};

	@action
	getMessagesFilters = async () => {
		try {
			const filters = await sseApi.getFilters('messages');
			const filtersInfo = await sseApi.getFiltersInfo('messages', filters);
			runInAction(() => {
				this.messagesFilterInfo = filtersInfo;
			});
		} catch (error) {
			console.error('Error occured while loading messages filters', error);
		}
	};
}
