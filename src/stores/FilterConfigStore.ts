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

import { MessagesFilterInfo, EventsFiltersInfo } from 'api/sse';
import ApiSchema from 'api/ApiSchema';
import { getDefaultMessagesFiltersState, getDefaultEventsFiltersState } from 'helpers/search';
import { computed, observable, runInAction } from 'mobx';
import { IFilterConfigStore } from 'models/Stores';
import EventsFilter from 'models/filter/EventsFilter';
import MessagesFilter from 'models/filter/MessagesFilter';

/* eslint-disable no-underscore-dangle */
// TODO: This store probably shouldnt expose both filterInfo and
// default filterState(eventFilters, messageFilters)
export class FilterConfigStore implements IFilterConfigStore {
	@observable
	private _messageSessions: Array<string> = [];

	@observable
	public eventFilterInfo: EventsFiltersInfo[] = [];

	@observable
	public messagesFilterInfo: MessagesFilterInfo[] = [];

	@observable
	public isLoadingMessageSessions = false;

	@observable
	public isEventFiltersLoading = false;

	@observable
	public isMessageFiltersLoading = false;

	@computed
	public get messageSessions(): string[] {
		return this._messageSessions;
	}

	@computed
	public get eventFilters(): EventsFilter | null {
		return this.eventFilterInfo ? getDefaultEventsFiltersState(this.eventFilterInfo) : null;
	}

	@computed
	public get messageFilters(): MessagesFilter | null {
		return this.messagesFilterInfo ? getDefaultMessagesFiltersState(this.messagesFilterInfo) : null;
	}

	constructor(private api: ApiSchema) {
		this.getMessageSessions();
		this.getEventFilters();
		this.getMessageFilters();
	}

	public async getMessageSessions() {
		runInAction(() => (this.isLoadingMessageSessions = true));
		try {
			const messageSessions = await this.api.messages.getMessageSessions();
			runInAction(() => {
				this._messageSessions = messageSessions;
			});
			runInAction(() => (this.isLoadingMessageSessions = false));
			return messageSessions;
		} catch (error) {
			console.error("Couldn't fetch sessions");
			runInAction(() => (this.isLoadingMessageSessions = false));
			return [];
		}
	}

	public getEventFilters = async () => {
		runInAction(() => (this.isEventFiltersLoading = true));
		try {
			const filters = await this.api.sse.getEventFilters();
			const filtersInfo = await this.api.sse.getEventsFiltersInfo(filters);
			runInAction(() => {
				this.eventFilterInfo = filtersInfo;
			});
			runInAction(() => (this.isEventFiltersLoading = false));
			return getDefaultEventsFiltersState(filtersInfo);
		} catch (error) {
			console.error('Error occured while loading event filters', error);
			runInAction(() => (this.isEventFiltersLoading = false));
			return null;
		}
	};

	public getMessageFilters = async () => {
		runInAction(() => (this.isMessageFiltersLoading = true));
		try {
			const filters = await this.api.sse.getMessagesFilters();
			const filtersInfo = await this.api.sse.getMessagesFiltersInfo(filters);
			runInAction(() => {
				this.messagesFilterInfo = filtersInfo;
			});
			runInAction(() => (this.isMessageFiltersLoading = false));
			return getDefaultMessagesFiltersState(filtersInfo);
		} catch (error) {
			runInAction(() => (this.isMessageFiltersLoading = false));
			console.error('Error occured while loading messages filters', error);
			return null;
		}
	};
}
