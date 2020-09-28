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

import {
	action, computed, observable, toJS, reaction, IReactionDisposer, runInAction,
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

export const defaultMessagesLoadingState = {
	loadingPreviousItems: false,
	loadingNextItems: false,
	loadingRootItems: false,
	loadingSelectedMessage: false,
};

export type MessagesStoreURLState = Partial<{
	type: TabTypes.Messages;
	filter: MessagesFilter;
}>;

export default class MessagesStore {
	public readonly MESSAGES_CHUNK_SIZE = 25;

	disposer: IReactionDisposer | null = null;

	filterStore = new FilterStore();

	@observable
	public messagesLoadingState = defaultMessagesLoadingState;

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesCache: Map<string, EventMessage> = observable.map();

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

	@observable
	public messageSessions: string[] = [];

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

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
				const streams = attachedMessages.map(m => m.sessionId)
					.filter((stream, index, self) => self.indexOf(stream) === index);
				if (streams.length) {
					this.messagesLoadingState.loadingSelectedMessage = true;
				}
				this.filterStore.messagesFilter.streams = streams;
			},
		);

		reaction(
			() => this.selectedMessageId,
			selectedMessageId => selectedMessageId && this.scrollToMessage(selectedMessageId.valueOf()),
		);

		this.loadMessageSessions();
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

	@action
	private getMessages = async (
		timelineDirection: 'next' | 'previous' = 'previous',
		originMessageId: string | null = null,
		limit = this.MESSAGES_CHUNK_SIZE,
		loadBody = false,
		abortSignal?: AbortSignal,
	// eslint-disable-next-line consistent-return
	): Promise<string[] | undefined> => {
		// streams are required to get messages
		if (this.filterStore.messagesFilter.streams.length === 0) {
			this.messagesIds = [];
			this.messagesCache.clear();
			this.isLoading = false;
			return [];
		}

		this.isLoading = true;

		try {
			let messagesIds: string[];

			if (loadBody) {
				const messages = await this.api.messages.getMessages({
					messageId: originMessageId ?? '',
					timelineDirection,
					limit,
					idsOnly: false,
				}, this.filterStore.messagesFilter, abortSignal);
				messagesIds = messages.map(msg => msg.messageId);
				messages.forEach(msg => {
					this.messagesCache.set(msg.messageId, msg);
				});
			} else {
				messagesIds = await this.api.messages.getMessages({
					messageId: originMessageId ?? '',
					timelineDirection,
					limit,
					idsOnly: true,
				}, this.filterStore.messagesFilter, abortSignal);
			}

			if (messagesIds.length === 0) {
				if (timelineDirection === 'previous') {
					this.isEndReached = true;
				} else {
					this.isBeginReached = true;
				}
			}

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
		}
	};

	@action
	private async loadMessageSessions() {
		try {
			const messageSessions = await this.api.messages.getMessageSessions();
			runInAction(() => {
				this.messageSessions = messageSessions;
			});
		} catch (error) {
			console.error('Couldn\'t fetch sessions');
		}
	}

	private abortControllers: { [key: string]: AbortController | null } = {
		prevAC: null,
		nextAC: null,
		scrollAC: null,
		rootAC: null,
	};

	@action
	public loadPreviousMessages = () => {
		if (this.isEndReached) return [] as any;
		this.abortControllers.prevAC?.abort();
		this.abortControllers.prevAC = new AbortController();

		this.messagesLoadingState.loadingPreviousItems = true;
		const originMessageId = !this.messagesIds.length
			? this.attachedMessages[0]?.messageId
			: this.messagesIds[this.messagesIds.length - 1];
		return this.getMessages(
			'previous',
			originMessageId,
			this.MESSAGES_CHUNK_SIZE,
			true,
			this.abortControllers.prevAC.signal,
		)
			.then(messagesIds => {
				this.messagesLoadingState.loadingPreviousItems = false;
				this.abortControllers.prevAC = null;
				return messagesIds;
			});
	};

	@action
	public loadNextMessages = () => {
		if (this.isBeginReached) return [] as any;
		this.abortControllers.nextAC?.abort();
		this.abortControllers.nextAC = new AbortController();
		this.messagesLoadingState.loadingNextItems = true;
		return this.getMessages(
			'next',
			this.messagesIds[0],
			this.MESSAGES_CHUNK_SIZE,
			true,
			this.abortControllers.nextAC.signal,
		)
			.then(messagesIds => {
				this.messagesLoadingState.loadingNextItems = false;
				this.abortControllers.nextAC = null;
				return messagesIds;
			});
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
			this.messagesLoadingState.loadingSelectedMessage = false;
			return;
		}
		this.abortControllers.scrollAC?.abort();
		this.abortControllers.scrollAC = new AbortController();

		this.messagesLoadingState.loadingSelectedMessage = true;
		this.getMessages(
			'previous',
			messageId,
			this.MESSAGES_CHUNK_SIZE - 1,
			false,
			this.abortControllers.scrollAC.signal,
		)
			.then(() => {
				this.scrolledIndex = this.messagesIds.indexOf(messageId);
			})
			.finally(() => {
				this.messagesLoadingState.loadingSelectedMessage = false;
				this.abortControllers.scrollAC = null;
			});
	};

	attachedMessagesAbortController: AbortController | null = null;

	@action
	private onAttachedMessagesIdsChange = async (attachedMessagesIds: string[]) => {
		if (!attachedMessagesIds.length) {
			this.attachedMessages = [];
			if (this.filterStore.messagesFilter.streams.length === 0) {
				this.messagesIds = [];
				this.messagesCache.clear();
			}
			return;
		}

		this.messagesLoadingState.loadingSelectedMessage = true;

		this.isBeginReached = false;
		this.isEndReached = false;
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

			const messages = sortMessagesByTimestamp(
				[...newlySelectedMessages, ...previouslySelectedMessages].filter(Boolean),
			);

			this.attachedMessages = messages;

			const messageId = messages.filter(m =>
				this.windowsStore.lastSelectedEvent?.attachedMessageIds.includes(m.messageId))[0]?.messageId;
			if (messageId) {
				this.selectedMessageId = new String(messageId);
				return;
			}
			if (messages.length > 0 && !messages.some(msg => this.messagesIds.includes(msg.messageId))) {
				this.selectedMessageId = new String(messages[0].messageId);
			} else {
				this.messagesLoadingState.loadingSelectedMessage = false;
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading attached messages', error);
			}
		}
	};

	@action
	private onFilterChange = (messagesFilter: MessagesFilter) => {
		this.abortControllers.rootAC?.abort();
		this.abortControllers.rootAC = new AbortController();
		this.messagesLoadingState.loadingRootItems = true;
		this.messagesIds = [];
		this.messagesCache.clear();
		this.selectedMessageId = null;
		this.scrolledIndex = null;
		this.isBeginReached = false;
		this.isEndReached = false;

		let originMessageId: string | undefined = this.attachedMessages[0]?.messageId;

		if (this.attachedMessages.length && (messagesFilter.timestampFrom || messagesFilter.timestampTo)) {
			const from = messagesFilter.timestampFrom || new Date(1980).getTime();
			const to = messagesFilter.timestampTo
			|| new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
			const firstMessage = this.attachedMessages.find(m =>
				getTimestampAsNumber(m.timestamp) >= from && getTimestampAsNumber(m.timestamp) <= to);
			originMessageId = firstMessage?.messageId;
		}

		this.getMessages('previous', originMessageId, this.MESSAGES_CHUNK_SIZE - 1)
			.finally(() => {
				this.messagesLoadingState.loadingRootItems = false;
				this.abortControllers.rootAC = null;
			});
	};

	@action
	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds);
		this.messagesCache = observable.map(toJS(store.messagesCache));
		this.beautifiedMessages = toJS(store.beautifiedMessages);
		this.detailedRawMessagesIds = toJS(store.detailedRawMessagesIds);
		this.isLoading = store.isLoading.valueOf();
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId ? new String(store.selectedMessageId.valueOf()) : null;
		this.messagesLoadingState = toJS(store.messagesLoadingState);
		this.attachedMessages = toJS(store.attachedMessages);
		this.messageSessions = toJS(store.messageSessions);
		this.filterStore = new FilterStore({ messagesFilter: toJS(store.filterStore.messagesFilter) });
		this.isEndReached = store.isEndReached.valueOf();
		this.isBeginReached = store.isBeginReached.valueOf();
	}
}
