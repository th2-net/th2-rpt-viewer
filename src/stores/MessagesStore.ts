/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import {
	action, computed, observable, toJS, reaction, IReactionDisposer,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';
import { prevCyclicItem, nextCyclicItem } from '../helpers/array';
import WindowsStore from './WindowsStore';
import { getTimestampAsNumber } from '../helpers/date';
import { TabTypes } from '../models/util/Windows';
import MessagesFilter from '../models/filter/MessagesFilter';
import { sortMessagesByTimestamp } from '../helpers/message';

export const enum MessagesLoadingState {
	LOADING_PREVIOUS_ITEMS,
	LOADING_NEXT_ITEMS,
	LOADING_ROOT_ITEMS,
	LOADING_SELECTED_MESSAGE,
}

export type MessagesStoreURLState = Partial<{
	type: TabTypes.Messages;
	filter: MessagesFilter;
}>;

export default class MessagesStore {
	private readonly MESSAGES_CHUNK_SIZE = 50;

	disposer: IReactionDisposer | null = null;

	filterStore = new FilterStore();

	@observable
	public messagesLoadingState: MessagesLoadingState | null = null;

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesCache: Map<string, EventMessage> = new Map();

	@observable
	public isLoading = false;

	@observable
	// eslint-disable-next-line @typescript-eslint/ban-types
	public scrolledIndex: Number | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: string[] = [];

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	// eslint-disable-next-line @typescript-eslint/ban-types
	public selectedMessageId: String | null = null;

	constructor(
		private api: ApiSchema,
		private windowsStore: WindowsStore,
		store?: MessagesStore,
	) {
		if (store) {
			this.copy(store);
		}

		// We have to dispose reaction after deleting tab otherwise store will not be garbage collected
		this.disposer = reaction(
			() => this.windowsStore.attachedMessagesIds,
			this.onAttachedMessagesIdsChange,
		);

		reaction(
			() => this.filterStore.messagesFilter,
			this.onFilterChange,
		);

		reaction(
			() => this.attachedMessages,
			attachedMessages => {
				this.filterStore.messagesFilter.streams = attachedMessages.map(m => m.sessionId)
					.filter((stream, index, self) => self.indexOf(stream) === index);
			},
		);

		reaction(
			() => this.selectedMessageId,
			selectedMessageId => selectedMessageId && this.scrollToMessage(selectedMessageId.valueOf()),
		);
	}

	@action
	public toggleMessageDetailedRaw = (messageId: string) => {
		if (this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
		} else {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	@action
	public toggleMessageBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
		} else {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	@action
	public fetchMessage = async (id: string) => {
		let message = this.messagesCache.get(id);

		if (!message) {
			message = await this.api.messages.getMessage(id);
			this.messagesCache.set(id, message);
		}

		return message;
	};

	// selected messages includes both attached and pinned messages
	@computed get selectedMessagesIds(): string[] {
		const pinnedMessages = this.windowsStore.pinnedMessages
			.filter(msg => this.messagesIds.includes(msg.messageId));

		const messages = [...this.attachedMessages, ...pinnedMessages]
			.filter((message, index, self) => self.findIndex(m => m.messageId === message.messageId) === index);

		const sortedMessages = sortMessagesByTimestamp(messages);

		if (this.filterStore.isMessagesFilterApplied) {
			return sortedMessages.filter(m => this.messagesIds.includes(m.messageId)).map(m => m.messageId);
		}

		return sortedMessages.map(m => m.messageId);
	}

	@action
	public selectNextMessage = () => {
		if (!this.selectedMessageId || !this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())) {
			this.selectedMessageId = this.selectedMessagesIds[0];
			return;
		}
		const nextMessageId = nextCyclicItem(this.selectedMessagesIds, this.selectedMessageId.valueOf());

		if (nextMessageId) this.selectedMessageId = nextMessageId;
	};

	@action
	public selectPrevMessage = () => {
		if (!this.selectedMessageId || !this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())) {
			this.selectedMessageId = this.selectedMessagesIds[this.selectedMessagesIds.length - 1];
			return;
		}
		const prevMessageId = prevCyclicItem(this.selectedMessagesIds, this.selectedMessageId.valueOf());

		if (prevMessageId) this.selectedMessageId = prevMessageId;
	};

	messagesAbortController: AbortController | null = null;

	@action
	private getMessages = async (
		timelineDirection: 'next' | 'previous' = 'previous',
		originMessageId?: string,
		limit = this.MESSAGES_CHUNK_SIZE,
	// eslint-disable-next-line consistent-return
	): Promise<string[] | undefined> => {
		this.messagesAbortController?.abort();

		// streams are required to get messages
		if (this.filterStore.messagesFilter.streams.length === 0) {
			this.messagesIds = [];
			this.messagesCache.clear();
			this.isLoading = false;
			this.messagesLoadingState = null;
			return [];
		}

		this.isLoading = true;

		try {
			this.messagesAbortController = new AbortController();

			const messagesIds = await this.api.messages.getMessages({
				messageId: originMessageId,
				timelineDirection,
				limit,
			}, this.filterStore.messagesFilter, this.messagesAbortController.signal);

			if (originMessageId && !this.messagesIds.includes(originMessageId)) {
				this.messagesCache.clear();
				this.messagesIds = [];
			}

			const newMessagesIds = timelineDirection === 'next'
				? messagesIds.reverse() : messagesIds;

			if (newMessagesIds.length) {
				// TODO: It's a temporary measure to build a timeline relatively to first
				// message timestamps until timeline helper api is released.
				await this.fetchMessage(messagesIds[0]);
			}

			if (timelineDirection === 'next') {
				this.messagesIds = [
					...newMessagesIds,
					...this.messagesIds,
				];
			} else {
				if (originMessageId && !this.messagesIds.includes(originMessageId)) {
					newMessagesIds.unshift(originMessageId);
				}
				this.messagesIds = [
					...this.messagesIds,
					...newMessagesIds,
				];
			}

			return messagesIds;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading messages', error);
			}
		} finally {
			this.isLoading = false;
			this.messagesLoadingState = null;
		}
	};

	@action
	public loadPreviousMessages = () => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_PREVIOUS_ITEMS;
		const originMessageId = !this.messagesIds.length
			? this.attachedMessages[0]?.messageId
			: this.messagesIds[this.messagesIds.length - 1];
		return this.getMessages('previous', originMessageId);
	};

	@action
	public loadNextMessages = () => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_NEXT_ITEMS;
		return this.getMessages('next', this.messagesIds[0]);
	};

	public resetMessagesFilter = () => {
		const streams = this.attachedMessages.map(m => m.sessionId)
			.filter((stream, index, self) => self.indexOf(stream) === index);
		this.filterStore.resetMessagesFilter(streams);
	};

	@action
	public scrollToMessage = (messageId: string) => {
		const messageIndex = this.messagesIds.indexOf(messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
			return;
		}
		this.messagesLoadingState = MessagesLoadingState.LOADING_SELECTED_MESSAGE;
		this.getMessages('previous', messageId, this.MESSAGES_CHUNK_SIZE - 1)
			.then(() => this.scrolledIndex = this.messagesIds.indexOf(messageId));
	};

	attachedMessagesAbortController: AbortController | null = null;

	@action
	private onAttachedMessagesIdsChange = async (attachedMessagesIds: string[]) => {
		if (!attachedMessagesIds.length) {
			this.attachedMessages = [];
			return;
		}

		this.attachedMessagesAbortController?.abort();

		const newlySelectedMessagesIds = attachedMessagesIds
			.filter(id => this.attachedMessages.findIndex(m => m.messageId === id) === -1);

		const previouslySelectedMessages = this.attachedMessages.filter(m => attachedMessagesIds.includes(m.messageId));

		try {
			this.attachedMessagesAbortController = new AbortController();

			const newlySelectedMessages = await Promise.all(
				newlySelectedMessagesIds.map(id => this.api.messages.getMessage(
					id, this.attachedMessagesAbortController?.signal,
				)),
			);

			const messages = sortMessagesByTimestamp([...newlySelectedMessages, ...previouslySelectedMessages]);

			this.attachedMessages = messages;

			if (this.windowsStore.lastSelectedEvent) {
				const messageId = messages.filter(m =>
					this.windowsStore.lastSelectedEvent?.attachedMessageIds.includes(m.messageId))[0]?.messageId;
				if (messageId) {
					this.selectedMessageId = new String(messageId);
				}
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading attached messages', error);
			}
		}
	};

	@action
	private onFilterChange = (messagesFilter: MessagesFilter) => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_ROOT_ITEMS;
		this.messagesIds = [];
		this.messagesCache.clear();
		this.selectedMessageId = null;
		this.scrolledIndex = null;

		let originMessageId: string | undefined = this.attachedMessages[0]?.messageId;

		if (this.attachedMessages.length && (messagesFilter.timestampFrom || messagesFilter.timestampTo)) {
			const from = messagesFilter.timestampFrom || new Date(1980).getTime();
			const to = messagesFilter.timestampTo
			|| new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
			const firstMessage = this.attachedMessages.find(m =>
				getTimestampAsNumber(m.timestamp) >= from && getTimestampAsNumber(m.timestamp) <= to);
			originMessageId = firstMessage?.messageId;
		}
		this.getMessages('previous', originMessageId, this.MESSAGES_CHUNK_SIZE - 1);
	};

	@action
	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds);
		this.messagesCache = observable(store.messagesCache);
		this.beautifiedMessages = observable(store.beautifiedMessages);
		this.detailedRawMessagesIds = observable(store.detailedRawMessagesIds);
		this.isLoading = store.isLoading.valueOf();
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId?.valueOf() || null;
		this.messagesLoadingState = store.messagesLoadingState?.valueOf() || null;
		this.attachedMessages = store.attachedMessages;
		this.filterStore = new FilterStore({ messagesFilter: toJS(store.filterStore.messagesFilter) });
	}
}
