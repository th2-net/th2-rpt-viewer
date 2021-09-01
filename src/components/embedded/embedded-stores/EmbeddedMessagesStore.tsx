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
import * as queryString from 'querystring';
import { EventMessage } from '../../../models/EventMessage';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import { isEventMessage } from '../../../helpers/event';
import ApiSchema from '../../../api/ApiSchema';
import { MessagesStoreURLState } from '../../../stores/messages/MessagesStore';
import EmbeddedMessagesDataProviderStore from './EmbeddedMessagesDataProviderStore';
import { MessagesSSEParams } from '../../../api/sse';

function getDefaultMessagesFilter(): MessagesFilter {
	const searchParams = queryString.parse(window.location.search);
	const sessions: string[] = [];
	const session = searchParams['session'].toString();

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

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

export default class EmbeddedMessagesStore {
	public dataStore = new EmbeddedMessagesDataProviderStore(this, this.api);

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

	constructor(private api: ApiSchema, defaultState?: MessagesStoreDefaultStateType) {
		this.init(defaultState);
		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	private init = async (defaultState: MessagesStoreDefaultStateType) => {
		if (!defaultState) {
			return;
		}
		if (typeof defaultState === 'string') {
			try {
				const message = await this.api.messages.getMessage(defaultState);
				this.onMessageSelect(message);
			} catch (error) {
				console.error(`Couldnt fetch target message ${defaultState}`);
			}
		} else {
			const message = defaultState.targetMessage;
			if (isEventMessage(message)) {
				this.selectedMessageId = new String(message.messageId);
				this.highlightedMessageId = message.messageId;
			}
		}
		this.dataStore.loadMessages();
	};

	public get filterParams(): MessagesSSEParams {
		const sseFilters = this.sseMessagesFilter;
		const filtersToAdd: ('attachedEventIds' | 'type' | 'body' | 'bodyBinary')[] = [];
		const searchParams = queryString.parse(window.location.search);
		if (searchParams.hasOwnProperty('body')) filtersToAdd.push('body');
		if (searchParams.hasOwnProperty('type')) filtersToAdd.push('type');
		if (searchParams.hasOwnProperty('attachedEventIds')) filtersToAdd.push('attachedEventIds');
		if (searchParams.hasOwnProperty('bodyBinary')) filtersToAdd.push('bodyBinary');

		const filterValues = filtersToAdd
			.map(filterName => [`${filterName}-values`, searchParams[filterName]])
			.filter(Boolean);

		const filterInclusion = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName]?.negative
				? [`${filterName}-negative`, sseFilters[filterName]?.negative]
				: [],
		);

		const filterConjunct = filtersToAdd.map(filterName =>
			sseFilters && sseFilters[filterName]?.conjunct
				? [`${filterName}-conjunct`, sseFilters[filterName]?.conjunct]
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
	public onMessageSelect = async (message: EventMessage) => {
		this.selectedMessageId = new String(message.messageId);
		this.highlightedMessageId = message.messageId;
	};
}
