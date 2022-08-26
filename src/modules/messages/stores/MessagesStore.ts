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

import { action, computed, observable, reaction, runInAction } from 'mobx';
import { IFilterConfigStore } from 'models/Stores';
import ApiSchema from 'api/ApiSchema';
import { EventMessage } from 'models/EventMessage';
import { EventTreeNode } from 'models/EventAction';
import { isAbortError } from 'helpers/fetch';
import MessagesFilter, { MessagesParams } from 'models/filter/MessagesFilter';
import { sortMessagesByTimestamp, isEventMessage } from 'helpers/message';
import { getItemAt } from 'helpers/array';
import { timestampToNumber } from 'helpers/date';
import { FiltersHistoryType } from 'stores/FiltersHistoryStore';
import MessageBodySortOrderStore from './MessageBodySortStore';
import MessagesDataProviderStore from './MessagesDataProviderStore';
import MessagesFilterStore, { MessagesFilterStoreInitialState } from './MessagesFilterStore';
import MessagesExportStore from './MessagesExportStore';
import MessagesViewTypeStore from './MessagesViewTypeStore';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

type MessageStoreOptions = Partial<{
	toggleBookmark: (message: EventMessage) => void;
	onFilterSubmit: (filter: MessagesFilter) => void;
	onSessionsSubmit: (sessions: string[]) => void;
	isLive: boolean;
}>;

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | null | undefined;

export default class MessagesStore {
	public filterStore: MessagesFilterStore;

	public dataStore: MessagesDataProviderStore;

	public exportStore = new MessagesExportStore();

	public messageViewStore: MessagesViewTypeStore;

	public messageDisplayRulesStore: MessageDisplayRulesStore;

	public messageBodySortStore: MessageBodySortOrderStore;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public showFilterChangeHint = false;

	@observable
	public isFilteringTargetMessages = false;

	/*
		 This is used for filter change hint. Represents either last clicked message
		 or attached messages
	 */
	public hintMessages: EventMessage[] = [];

	constructor(
		public filterConfigStore: IFilterConfigStore,
		private api: ApiSchema,
		defaultState: MessagesStoreDefaultStateType,
		private options: MessageStoreOptions,
	) {
		this.filterStore = new MessagesFilterStore(
			this.filterConfigStore,
			defaultState && typeof defaultState === 'object' ? defaultState : undefined,
		);
		this.dataStore = new MessagesDataProviderStore(this, this.api);
		this.messageDisplayRulesStore = MessageDisplayRulesStore.getInstance(this.api.indexedDb);
		this.messageBodySortStore = MessageBodySortOrderStore.getInstance(this.api.indexedDb);
		this.messageViewStore = new MessagesViewTypeStore(this.messageDisplayRulesStore);

		this.init(defaultState, Boolean(options.isLive));

		reaction(() => this.attachedMessages, this.onAttachedMessagesChange);

		reaction(
			() => this.filterStore.params,
			() => {
				this.exportStore.disableExport();
				this.messageViewStore.resetSavedViewTypes();
			},
		);
	}

	@observable
	public bookmarks: Map<string, true> = new Map();

	@observable
	public sessionsHistory: string[] = [];

	public onSessionHistoryChange = (sessions: string[]) => {
		this.sessionsHistory = sessions;
	};

	@action
	public onBookmarksChange = (bookmarks: EventMessage[]) => {
		this.bookmarks = bookmarks.reduce(
			(map, bookmark) => map.set(bookmark.id, true),
			new Map<string, true>(),
		);
	};

	public toggleBookmark = (message: EventMessage) => {
		if (this.options.toggleBookmark) {
			this.options.toggleBookmark(message);
		}
	};

	@observable
	public filtersHistory: FiltersHistoryType<MessagesFilter>[] = [];

	public onFilterHistoryChange = (filtersHistory: FiltersHistoryType<MessagesFilter>[]) => {
		this.filtersHistory = filtersHistory;
	};

	public saveFilter = (filter: MessagesFilter) => {
		if (this.options.onFilterSubmit) {
			this.options.onFilterSubmit(filter);
		}
	};

	public saveSessions = (sessions: string[]) => {
		if (this.options.onSessionsSubmit) {
			this.options.onSessionsSubmit(sessions);
		}
	};

	@observable.ref
	public messagesInView: EventMessage[] = [];

	@action
	public setRenderedItems = (renderedMessages: EventMessage[]) => {
		this.messagesInView = renderedMessages;
	};

	@computed
	public get messageSessions(): string[] {
		return this.filterConfigStore.messageSessions;
	}

	@action
	public applyFilter = (params: MessagesParams, filter: MessagesFilter | null) => {
		this.exportStore.disableExport();
		this.hintMessages = [];
		this.showFilterChangeHint = false;
		this.highlightedMessageId = null;
		this.filterStore.setMessagesFilter(params, filter);
	};

	private init = async (defaultState: MessagesStoreDefaultStateType, isLive: boolean) => {
		if (defaultState && isEventMessage(defaultState.targetMessage)) {
			this.onMessageSelect(defaultState.targetMessage);
		} else if (isLive) {
			this.dataStore.updateStore.subscribeOnChanges();
		} else {
			this.dataStore.loadMessages();
		}
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const shouldShowFilterHintBeforeRefetchingMessages = await this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const streams = this.filterStore.params.streams;

			this.selectedMessageId = new String(message.id);
			this.highlightedMessageId = new String(message.id);
			this.hintMessages = [];

			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: timestampToNumber(message.timestamp),
				streams: [...new Set([...streams, message.sessionId])],
			});
		}
	};

	@action
	public selectAttachedMessage = (message: EventMessage) => {
		const messageIndex = this.dataStore.messages.findIndex(m => m.id === message.id);
		if (messageIndex !== -1) {
			this.selectedMessageId = new String(message.id);
			this.highlightedMessageId = new String(message.id);
		} else {
			this.onMessageSelect(message);
		}
	};

	@action
	public clearFilters = () => {
		this.hintMessages = [];
		this.filterStore.resetMessagesFilter({ streams: this.filterStore.params.streams });
		this.dataStore.stopMessagesLoading();
		this.dataStore.resetState();
	};

	@action
	/*
		This method handles message select or attached messages change events.
		When those events occur we want to check if selected message or
		attached messages match current filter and streams. If it doesn't match
		filter change hint window is shown to a user. And it is up to user to decide
		if he wants to reset streams to message(s) streams and update filters
	 */
	private handleFilterHint = async (message: EventMessage | EventMessage[]): Promise<boolean> => {
		this.hintMessages = Array.isArray(message) ? message : [message];
		const matchMessageParams = this.filterStore.filterParams;

		if (
			this.hintMessages.length === 0 ||
			(!matchMessageParams.filters?.length && !matchMessageParams.stream.length)
		) {
			this.showFilterChangeHint = false;
			return this.showFilterChangeHint;
		}

		runInAction(() => (this.isFilteringTargetMessages = true));

		const hintMessagesMatch = await Promise.all(
			this.hintMessages.map(hm => this.api.messages.matchMessage(hm.id, matchMessageParams)),
		).finally(() => {
			runInAction(() => (this.isFilteringTargetMessages = false));
		});

		this.showFilterChangeHint = hintMessagesMatch.some(isMatched => !isMatched);

		return this.showFilterChangeHint;
	};

	@action
	public applyFilterHint = () => {
		if (!this.hintMessages.length) return;

		this.dataStore.searchChannelNext?.stop();
		this.dataStore.searchChannelPrev?.stop();

		const targetMessage: EventMessage = sortMessagesByTimestamp(this.hintMessages)[0];

		this.selectedMessageId = new String(targetMessage.id);
		this.highlightedMessageId = new String(targetMessage.id);
		this.showFilterChangeHint = false;

		this.filterStore.resetMessagesFilter({
			streams: [...new Set(this.hintMessages.map(({ sessionId }) => sessionId))],
			timestampTo: timestampToNumber(targetMessage.timestamp),
			timestampFrom: null,
		});

		this.hintMessages = [];
	};

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	public isLoadingAttachedMessages = false;

	private attachedMessagesAC: AbortController | null = null;

	@action
	public onSelectedEventChange = async (eventTreeNode: EventTreeNode | null) => {
		if (!eventTreeNode) {
			this.isLoadingAttachedMessages = false;
			this.attachedMessages = [];
			return;
		}
		this.isLoadingAttachedMessages = true;
		if (this.attachedMessagesAC) {
			this.attachedMessagesAC.abort();
		}
		this.attachedMessagesAC = new AbortController();
		try {
			const event = await this.api.events.getEvent(
				eventTreeNode.eventId,
				this.attachedMessagesAC.signal,
			);
			const attachedMessages = await Promise.all(
				event.attachedMessageIds.map(id =>
					this.api.messages.getMessage(id, this.attachedMessagesAC?.signal),
				),
			);
			this.attachedMessages = sortMessagesByTimestamp(attachedMessages);
		} catch (error) {
			if (!isAbortError(error)) {
				console.error('Error while loading attached messages', error);
			}
			this.attachedMessages = [];
		} finally {
			this.attachedMessagesAC = null;
			this.isLoadingAttachedMessages = false;
		}
	};

	@action
	public onAttachedMessagesChange = async (attachedMessages: EventMessage[]) => {
		const shouldShowFilterHintBeforeRefetchingMessages = await this.handleFilterHint(
			attachedMessages,
		);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const mostRecentMessage = getItemAt(sortMessagesByTimestamp(attachedMessages), 0);
			if (mostRecentMessage) {
				const streams = this.filterStore.params.streams;
				this.selectedMessageId = new String(mostRecentMessage.id);
				this.filterStore.params = {
					...this.filterStore.params,
					streams: [
						...new Set([...streams, ...attachedMessages.map(({ sessionId }) => sessionId)]),
					],
					timestampTo: timestampToNumber(mostRecentMessage.timestamp),
				};
			}
		}
	};

	// Unsubcribe from reactions
	public dispose = () => {
		this.filterStore.dispose();
		this.dataStore.stopMessagesLoading();
		this.dataStore.resetState();
	};
}
