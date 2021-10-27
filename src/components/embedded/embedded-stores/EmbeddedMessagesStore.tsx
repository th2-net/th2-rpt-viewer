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
import moment from 'moment';
import { action, reaction, observable, runInAction } from 'mobx';
import { EventMessage } from '../../../models/EventMessage';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import ApiSchema from '../../../api/ApiSchema';
import EmbeddedMessagesDataProviderStore from './EmbeddedMessagesDataProviderStore';
import { MessagesSSEParams } from '../../../api/sse';

function getDefaultMessagesFilter(): MessagesFilter {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

type EmbeddedMessagesFilterInitialState = {
	timestampFrom: number | null;
	timestampTo: number | null;
	streams: string[];
	sse: MessageFilterState;
};

export default class EmbeddedMessagesStore {
	public dataStore: EmbeddedMessagesDataProviderStore;

	@observable
	public hoveredMessage: EventMessage | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: Array<string> = [];

	@observable sseMessagesFilter: MessageFilterState | null = null;

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	constructor(private api: ApiSchema) {
		this.dataStore = new EmbeddedMessagesDataProviderStore(this, this.api);
		this.init(this.getURLState());

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	public get filterParams(): MessagesSSEParams {
		const sseFilters = this.sseMessagesFilter;

		const filtersToAdd: Array<keyof MessageFilterState> = !sseFilters
			? []
			: Object.entries(sseFilters)
					.filter(([_, filter]) => filter.values.length > 0)
					.map(([filterName]) => filterName as keyof MessageFilterState);

		const filterValues = filtersToAdd
			.map(filterName =>
				sseFilters ? [`${filterName}-values`, sseFilters[filterName].values] : [],
			)
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
			searchDirection: 'previous',
			resultCountLimit: 15,
			filters: filtersToAdd,
			...Object.fromEntries([...filterValues, ...filterInclusion, ...filterConjunct]),
		};

		return queryParams;
	}

	@action
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.dataStore.messages.findIndex(
			(m: { messageId: string }) => m.messageId === messageId,
		);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	@action
	public loadLastMessages = () => {
		this.filter = {
			...this.filter,
			timestampFrom: null,
			timestampTo: moment().utc().valueOf(),
		};
	};

	private getURLState = (): EmbeddedMessagesFilterInitialState => {
		if (window.location.search.split('&').length !== 2) {
			throw new Error('Only two query parameters expected.');
		}

		const searchParams = new URLSearchParams(window.location.search);
		const messagesUrlState = searchParams.get('messages');

		if (!messagesUrlState) throw new Error("The query parameter 'Messages' was not passed");

		return JSON.parse(window.atob(messagesUrlState));
	};

	private init = async (initialState: EmbeddedMessagesFilterInitialState) => {
		const defaultMessagesFilter = getDefaultMessagesFilter();
		const {
			streams,
			timestampFrom = defaultMessagesFilter.timestampFrom,
			timestampTo = defaultMessagesFilter.timestampTo,
		} = initialState;

		runInAction(() => {
			this.filter = {
				streams,
				timestampFrom,
				timestampTo,
			};
			this.sseMessagesFilter = initialState.sse;
		});
	};
}
