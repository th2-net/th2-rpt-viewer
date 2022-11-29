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

import { action, computed, IReactionDisposer, observable, reaction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import moment from 'moment';
import { IFilterConfigStore } from 'models/Stores';
import MessagesFilter, { MessagesParams } from 'models/filter/MessagesFilter';
import { getMessagesSSEParams, MessagesFilterInfo, MessagesSSEParams } from 'api/sse';
import { SearchDirection } from 'models/SearchDirection';
import notificationsStore from 'stores/NotificationsStore';
import { TimeRange } from 'models/Timestamp';

function getDefaultMessagesParams(): MessagesParams {
	return {
		startTimestamp: moment.utc().valueOf(),
		endTimestamp: null,
		streams: [],
	};
}

export type MessagesFilterStoreInitialState = {
	sse?: Partial<MessagesFilter> | null;
	isSoftFilter?: boolean;
} & Partial<MessagesParams>;

export default class MessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	private sseFilterInfoSubscription: IReactionDisposer;

	public SESSIONS_LIMIT = 5;

	constructor(
		private filtersStore: IFilterConfigStore,
		initialState?: MessagesFilterStoreInitialState,
	) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(() => filtersStore.messageFilters, this.initSSEFilter);
		this.sseFilterInfoSubscription = reaction(
			() => filtersStore.messagesFilterInfo,
			filterInfo => (this.filterInfo = filterInfo),
			{ fireImmediately: true },
		);
	}

	@observable.ref
	public filterInfo: MessagesFilterInfo[] = [];

	@observable params: MessagesParams = getDefaultMessagesParams();

	@observable filter: MessagesFilter | null = null;

	/*
		When isSoftFilter is applied messages that don't match filter are not excluded,
		instead we highlight messages that matched filter
	*/
	@observable isSoftFilter = false;

	@computed
	public get filterParams(): MessagesSSEParams {
		return getMessagesSSEParams({
			filter: this.filter,
			params: this.params,
			searchDirection: SearchDirection.Previous,
			resultCountLimit: 15,
		});
	}

	@computed
	public get softFilterParams(): MessagesSSEParams {
		return {
			startTimestamp: this.filterParams.startTimestamp,
			stream: this.filterParams.stream,
			searchDirection: this.filterParams.searchDirection,
			endTimestamp: this.filterParams.endTimestamp,
			resultCountLimit: this.filterParams.resultCountLimit,
		};
	}

	@action
	public setStartTimestamp = (timestamp: number) => {
		this.params.startTimestamp = timestamp;
	};

	@action
	public setEndTimestamp = (timestamp: number) => {
		this.params.endTimestamp = timestamp;
	};

	@action
	public setRange = ([startTimestamp, endTimestamp]: TimeRange) => {
		this.params.startTimestamp = startTimestamp;
		this.params.endTimestamp = endTimestamp;
	};

	@computed
	public get isMessagesFilterApplied() {
		if (!this.filter) return false;
		return Object.values(this.filter).some(filter => filter.values.length > 0);
	}

	@action
	public setMessagesFilter(params: MessagesParams, filter: MessagesFilter | null = null) {
		this.params = params;
		this.filter = filter;
		params.streams.slice(this.SESSIONS_LIMIT).forEach(session =>
			notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'error',
				header: `Sessions limit of ${this.SESSIONS_LIMIT} reached.`,
				description: `Session ${session} not included in current sessions.`,
				id: nanoid(),
			}),
		);
	}

	@action
	public setStreams = (streams: string[]) => {
		this.params = { ...this.params, streams };
	};

	@action
	public clearFilter = (initialParams: Partial<MessagesParams> = {}) => {
		const filter = toJS(this.filtersStore.messageFilters);
		const defaultMessagesFilter = getDefaultMessagesParams();
		this.filter = filter;
		this.isSoftFilter = false;
		this.params = {
			...defaultMessagesFilter,
			startTimestamp: this.params.startTimestamp,
			endTimestamp: this.params.endTimestamp,
			...initialParams,
		};
	};

	private init = (initialState?: MessagesFilterStoreInitialState) => {
		if (initialState) {
			const defaultMessagesFilter = getDefaultMessagesParams();
			const {
				streams = defaultMessagesFilter.streams,
				startTimestamp = defaultMessagesFilter.startTimestamp,
				endTimestamp = defaultMessagesFilter.endTimestamp,
				sse = {},
			} = initialState;

			const appliedSSEFilter = {
				...toJS(this.filtersStore.messageFilters || {}),
				...sse,
			} as MessagesFilter;
			this.setMessagesFilter(
				{
					streams,
					startTimestamp,
					endTimestamp,
				},
				Object.keys(appliedSSEFilter).length > 0 ? appliedSSEFilter : null,
			);
		} else {
			this.setDefaultSSEFilter();
		}
	};

	@action
	private setDefaultSSEFilter = () => {
		this.filter = toJS(this.filtersStore.messageFilters);
	};

	@action
	private initSSEFilter = (filters: MessagesFilter | null) => {
		const filtersCopy = toJS(filters);

		if (filtersCopy) {
			this.filter = {
				...filtersCopy,
				...(this.filter || {}),
			};
		}
	};

	@action
	public setSoftFilter = (isChecked: boolean): void => {
		this.isSoftFilter = isChecked;
	};

	public dispose = () => {
		this.sseFilterSubscription();
		this.sseFilterInfoSubscription();
	};
}
