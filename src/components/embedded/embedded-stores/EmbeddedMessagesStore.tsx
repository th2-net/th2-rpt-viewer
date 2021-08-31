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
import { ListRange } from 'react-virtuoso';
import { action, reaction, observable } from 'mobx';
import { EventMessage } from '../../../models/EventMessage';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import { isEventMessage } from '../../../helpers/event';
import ApiSchema from '../../../api/ApiSchema';
import { MessagesStoreURLState } from '../../../stores/messages/MessagesStore';
import EmbeddedMessagesDataProviderStore from './EmbeddedMessagesDataProviderStore';
import { MessagesSSEParams } from '../../../api/sse';

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

	@observable
	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	@observable
	public showFilterChangeHint = false;

	/*
		  This is used for filter change hint. Represents either last clicked message
		  or attached messages
	  */
	public hintMessages: EventMessage[] = [];

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
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('body')) filtersToAdd.push('body');
		if (searchParams.has('type')) filtersToAdd.push('type');
		if (searchParams.has('attachedEventIds')) filtersToAdd.push('attachedEventIds');
		if (searchParams.has('bodyBinary')) filtersToAdd.push('bodyBinary');

		const filterValues = filtersToAdd
			.map(filterName => [`${filterName}-values`, searchParams.get(filterName)])
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
		const shouldShowFilterHintBeforeRefetchingMessages = this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = message.messageId;
			this.hintMessages = [];
		}
	};

	@action
	/*
		  This method handles message select or attached messages change events.
		  When those events occur we want to check if selected message or
		  attached messages match current filter and streams. If it doesn't match
		  filter change hint window is shown to a user. And it is up to him to decide
		  if he wants to reset streams to message(s) streams and update filters
	  */
	private handleFilterHint = (message: EventMessage | EventMessage[]): boolean => {
		this.hintMessages = Array.isArray(message) ? message : [message];

		if (this.hintMessages.length === 0) {
			this.showFilterChangeHint = false;
			return this.showFilterChangeHint;
		}

		const sseFilter = this.sseMessagesFilter;
		const areFiltersApplied = [
			sseFilter
				? [sseFilter.attachedEventIds.values, sseFilter.body.values, sseFilter.type.values].flat()
				: [],
		].some(filterValues => filterValues.length > 0);

		this.showFilterChangeHint = areFiltersApplied;

		return this.showFilterChangeHint;
	};
}
