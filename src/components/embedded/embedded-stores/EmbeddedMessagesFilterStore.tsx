/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
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
import { IReactionDisposer, reaction, observable, computed, action } from 'mobx';
import EmbeddedSearchStore from './EmbeddedSearchStore';
import moment from 'moment';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import { MessagesSSEParams, MessagesFilterInfo } from '../../../api/sse';
import { getDefaultMessagesFiltersState } from '../../../helpers/search';

function getDefaultMessagesFilter(): MessagesFilter {
	const searchParams = new URLSearchParams(window.location.search);
	const sessions: string[] = [];
	const session = searchParams.get('session');

	function defineSessions(): string[] {
		if (session) sessions[0] = session;
		return sessions;
	}
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: defineSessions(),
	};
}

export type MessagesFilterStoreInitialState = {
	sse?: Partial<MessageFilterState> | null;
	isSoftFilter?: boolean;
} & Partial<MessagesFilter>;

export default class EmbeddedMessagesFilterStore {
	private sseFilterSubscription: IReactionDisposer;

	constructor(
		private searchStore: EmbeddedSearchStore,
		initialState?: MessagesFilterStoreInitialState,
	) {
		this.init(initialState);

		this.sseFilterSubscription = reaction(() => searchStore.messagesFilterInfo, this.initSSEFilter);
	}

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	@observable sseMessagesFilter: MessageFilterState | null = null;

	/*
		  When isSoftFilter is applied messages that don't match filter are not excluded,
		  instead we highlight messages that matched filter
	  */
	@observable isSoftFilter = false;

	@computed
	public get filterParams(): MessagesSSEParams {
		const sseFilters = this.sseMessagesFilter;
		const filtersToAdd: ('attachedEventIds' | 'type' | 'body')[] = [];
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('body')) filtersToAdd.push('body');
		if (searchParams.has('type')) filtersToAdd.push('type');
		if (searchParams.has('attachedEventIds')) filtersToAdd.push('attachedEventIds');

		const filterValues = filtersToAdd
			.map(filterName => [`${filterName}-values`, searchParams.get(filterName)])
			.filter(Boolean);

		const filterInclusion = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName].negative
				? [`${filterName}-negative`, sseFilters[filterName].negative]
				: [],
		);

		const filterConjunct = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName].conjunct
				? [`${filterName}-conjunct`, sseFilters[filterName].conjunct]
				: [],
		);

		const endTimestamp = moment().utc().subtract(30, 'minutes').valueOf();
		const startTimestamp = moment(endTimestamp).add(5, 'minutes').valueOf();

		const queryParams: MessagesSSEParams = {
			startTimestamp: this.filter.timestampTo || startTimestamp,
			stream: this.filter.streams,
			resultCountLimit: 20,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion, ...filterConjunct]),
		};

		return queryParams;
	}
	@computed
	public get softFilterParams(): MessagesSSEParams {
		return {
			startTimestamp: this.filterParams.startTimestamp,
			stream: this.filterParams.stream,
			searchDirection: this.filterParams.searchDirection,
			endTimestamp: this.filterParams.endTimestamp,
			resultCountLimit: this.filterParams.resultCountLimit,
			resumeFromId: this.filterParams.resumeFromId,
		};
	}
	@computed
	public get isMessagesFilterApplied() {
		return [
			this.sseMessagesFilter
				? [
						this.sseMessagesFilter.attachedEventIds.values,
						this.sseMessagesFilter.body.values,
						this.sseMessagesFilter.type.values,
				  ].flat()
				: [],
		].some(filter => filter.length > 0);
	}

	@action
	public setMessagesFilter(
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null = null,
		isSoftFilterApplied: boolean,
	) {
		this.isSoftFilter = isSoftFilterApplied;
		this.sseMessagesFilter = sseFilters;
		this.filter = filter;
	}

	@action
	public resetMessagesFilter = (initFilter: Partial<MessagesFilter> = {}) => {
		const filter = getDefaultMessagesFiltersState(this.searchStore.messagesFilterInfo);
		const defaultMessagesFilter = getDefaultMessagesFilter();
		this.isSoftFilter = false;
		this.sseMessagesFilter = filter;
		this.filter = {
			...defaultMessagesFilter,
			timestampFrom: this.filter.timestampFrom,
			timestampTo: this.filter.timestampTo,
			...initFilter,
		};
	};

	private init = (initialState?: MessagesFilterStoreInitialState) => {
		if (initialState) {
			const defaultMessagesFilter = getDefaultMessagesFilter();
			const {
				streams = defaultMessagesFilter.streams,
				timestampFrom = defaultMessagesFilter.timestampFrom,
				timestampTo = defaultMessagesFilter.timestampTo,
				sse = {},
				isSoftFilter = false,
			} = initialState;

			const appliedSSEFilter = {
				...(getDefaultMessagesFiltersState(this.searchStore.messagesFilterInfo) || {}),
				...sse,
			} as MessageFilterState;
			this.setMessagesFilter(
				{
					streams,
					timestampFrom,
					timestampTo,
				},
				Object.keys(appliedSSEFilter).length > 0 ? appliedSSEFilter : null,
				isSoftFilter,
			);
		} else {
			this.setSSEMessagesFilter(this.searchStore.messagesFilterInfo);
		}
	};

	@action
	private setSSEMessagesFilter = (messagesFilterInfo: MessagesFilterInfo[]) => {
		this.sseMessagesFilter = getDefaultMessagesFiltersState(messagesFilterInfo);
	};

	@action
	private initSSEFilter = (filterInfo: MessagesFilterInfo[]) => {
		if (this.sseMessagesFilter) {
			const defaultState = getDefaultMessagesFiltersState(filterInfo) || {};
			this.sseMessagesFilter = {
				...defaultState,
				...this.sseMessagesFilter,
			};
		} else {
			this.setSSEMessagesFilter(filterInfo);
		}
	};

	@action
	public setSoftFilter = (isChecked: boolean): void => {
		this.isSoftFilter = isChecked;
	};

	public dispose = () => {
		this.sseFilterSubscription();
	};
}
