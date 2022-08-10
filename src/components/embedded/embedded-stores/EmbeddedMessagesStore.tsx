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
import { action, reaction, observable } from 'mobx';
import { EventMessage } from '../../../models/EventMessage';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import ApiSchema from '../../../api/ApiSchema';
import EmbeddedMessagesDataProviderStore from './EmbeddedMessagesDataProviderStore';
import EmbeddedMessagesFilterStore, {
	EmbeddedMessagesFilterInitialState,
} from './EmbeddedMessagesFilterStore';

function getDefaultMessagesFilter(): MessagesFilter {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

export default class EmbeddedMessagesStore {
	public dataStore: EmbeddedMessagesDataProviderStore;

	public filterStore: EmbeddedMessagesFilterStore;

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

	constructor(private api: ApiSchema) {
		const initialState = this.getURLState();
		const defaultMessagesFilter = getDefaultMessagesFilter();
		const {
			timestampFrom = defaultMessagesFilter.timestampFrom,
			timestampTo = defaultMessagesFilter.timestampTo,
		} = initialState;

		this.filterStore = new EmbeddedMessagesFilterStore(this.api, {
			...initialState,
			timestampFrom,
			timestampTo,
		});
		this.dataStore = new EmbeddedMessagesDataProviderStore(this, this.api);

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);

		this.bookId = initialState.bookId;
	}

	public bookId: string;

	@action
	public applyFilter = (filter: MessagesFilter, sseFilters: MessageFilterState | null) => {
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.filterStore.setMessagesFilter(filter, sseFilters);
	};

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

	private getURLState = (): EmbeddedMessagesFilterInitialState => {
		if (window.location.search.split('&').length !== 2) {
			throw new Error('Only two query parameters expected.');
		}

		const searchParams = new URLSearchParams(window.location.search);
		const messagesUrlState = searchParams.get('messages');

		if (!messagesUrlState) throw new Error("The query parameter 'Messages' was not passed");

		return JSON.parse(window.atob(messagesUrlState));
	};

	@action
	public clearFilters = () => {
		this.filterStore.resetMessagesFilter({ streams: this.filterStore.filter.streams });
		this.dataStore.stopMessagesLoading();
		this.dataStore.resetState();
	};
}
