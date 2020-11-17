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

import { action, computed, observable, toJS, reaction, IReactionDisposer, runInAction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';
import { prevCyclicItem, nextCyclicItem } from '../helpers/array';
import { getTimestampAsNumber } from '../helpers/date';
import { TabTypes } from '../models/util/Windows';
import MessagesFilter from '../models/filter/MessagesFilter';
import { sortMessagesByTimestamp } from '../helpers/message';
import { SelectedStore } from './SelectedStore';

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

	private attachedMessagesIdsSubscription: IReactionDisposer;

	private attachedMessagesSubscription: IReactionDisposer;

	filterStore = new FilterStore();

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesLoadingState = defaultMessagesLoadingState;

	@observable
	public messagesCache: Map<string, EventMessage> = observable.map(new Map(), { deep: false });

	@observable
	public messageSessions: string[] | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: string[] = [];

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

	constructor(private api: ApiSchema, private selectedStore: SelectedStore, store?: MessagesStore) {
		if (store) {
			this.copy(store);
		}

		reaction(() => this.filterStore.messagesFilter, this.onFilterChange);

		this.attachedMessagesIdsSubscription = reaction(
			() => this.selectedStore.attachedMessagesIds,
			() => Object.values(this.abortControllers).forEach(ac => ac?.abort()),
		);

		this.attachedMessagesSubscription = reaction(
			() => this.selectedStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(
			() => this.filterStore.messagesFilter.streams,
			streams => {
				if (streams.length === 0) {
					this.resetMessagesState();
				}
			},
		);

		reaction(
			() => this.selectedMessageId,
			selectedMessageId => selectedMessageId && this.scrollToMessage(selectedMessageId.valueOf()),
		);

		if (!store) this.loadMessageSessions();
	}

	dispose = () => {
		this.attachedMessagesIdsSubscription();
		this.attachedMessagesSubscription();
	};

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
		const pinnedMessages = this.selectedStore.pinnedMessages.filter(msg =>
			this.messagesIds.includes(msg.messageId),
		);

		const messages = [...this.selectedStore.attachedMessages, ...pinnedMessages].filter(
			(message, index, self) => self.findIndex(m => m.messageId === message.messageId) === index,
		);

		const sortedMessages = sortMessagesByTimestamp(messages);

		if (this.filterStore.isMessagesFilterApplied) {
			return sortedMessages
				.filter(m => this.messagesIds.includes(m.messageId))
				.map(m => m.messageId);
		}

		return sortedMessages.map(m => m.messageId);
	}

	@action
	public selectNextMessage = () => {
		if (
			!this.selectedMessageId ||
			!this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())
		) {
			this.selectedMessageId = this.selectedMessagesIds[0];
			return;
		}
		const nextMessageId = nextCyclicItem(
			this.selectedMessagesIds,
			this.selectedMessageId.valueOf(),
		);

		if (nextMessageId) this.selectedMessageId = nextMessageId;
	};

	@action
	public selectPrevMessage = () => {
		if (
			!this.selectedMessageId ||
			!this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())
		) {
			this.selectedMessageId = this.selectedMessagesIds[this.selectedMessagesIds.length - 1];
			return;
		}
		const prevMessageId = prevCyclicItem(
			this.selectedMessagesIds,
			this.selectedMessageId.valueOf(),
		);

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
			this.resetMessagesState();
			return [];
		}

		try {
			let messagesIds: string[];

			if (loadBody) {
				const messages = await this.api.messages.getMessages(
					{
						messageId: originMessageId ?? '',
						timelineDirection,
						limit,
						idsOnly: false,
					},
					this.filterStore.messagesFilter,
					abortSignal,
				);
				messagesIds = messages.map(msg => msg.messageId);
				messages.forEach(msg => {
					this.messagesCache.set(msg.messageId, msg);
				});
			} else {
				messagesIds = await this.api.messages.getMessages(
					{
						messageId: originMessageId ?? '',
						timelineDirection,
						limit,
						idsOnly: true,
					},
					this.filterStore.messagesFilter,
					abortSignal,
				);
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

			const newMessagesIds = timelineDirection === 'next' ? messagesIds.reverse() : messagesIds;

			if (newMessagesIds.length) {
				// TODO: It's a temporary measure to build a timeline relatively to first
				// message timestamps until timeline helper api is released.
				await this.fetchMessage(messagesIds[0]);
			}

			if (timelineDirection === 'next') {
				this.messagesIds = [...newMessagesIds, ...this.messagesIds];
			} else {
				if (originMessageId && !this.messagesIds.includes(originMessageId)) {
					newMessagesIds.unshift(originMessageId);
				}
				this.messagesIds = [...this.messagesIds, ...newMessagesIds];
			}

			return messagesIds;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading messages', error);
			}
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
			console.error("Couldn't fetch sessions");
		}
	}

	private abortControllers: { [key: string]: AbortController | null } = {
		prevAC: null,
		nextAC: null,
	};

	@action
	public loadPreviousMessages = async (loadBody = true, messageId?: string) => {
		if (this.isEndReached) return [];
		this.abortControllers.prevAC?.abort();
		this.abortControllers.prevAC = new AbortController();

		this.messagesLoadingState.loadingPreviousItems = true;
		const originMessageId =
			messageId ||
			(!this.messagesIds.length
				? this.selectedStore.attachedMessages[0]?.messageId
				: this.messagesIds[this.messagesIds.length - 1]);
		const chunkSize = messageId ? this.MESSAGES_CHUNK_SIZE - 1 : this.MESSAGES_CHUNK_SIZE;

		try {
			const previousMessages = await this.getMessages(
				'previous',
				originMessageId,
				chunkSize,
				loadBody,
				this.abortControllers.prevAC.signal,
			);
			this.messagesLoadingState.loadingPreviousItems = false;
			return previousMessages;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading messages', error);
				this.messagesLoadingState.loadingPreviousItems = false;
			}
			return [];
		} finally {
			this.abortControllers.prevAC = null;
		}
	};

	@action
	public loadNextMessages = async () => {
		if (this.isBeginReached) return [];
		this.abortControllers.nextAC?.abort();
		this.abortControllers.nextAC = new AbortController();
		this.messagesLoadingState.loadingNextItems = true;
		try {
			const nextMessages = await this.getMessages(
				'next',
				this.messagesIds[0] || this.selectedStore.attachedMessages[0].messageId,
				this.MESSAGES_CHUNK_SIZE,
				true,
				this.abortControllers.nextAC.signal,
			);
			this.messagesLoadingState.loadingNextItems = false;
			return nextMessages;
		} catch (error) {
			if (error.name !== 'AbortError') {
				this.messagesLoadingState.loadingNextItems = false;
			}
			return [];
		} finally {
			this.abortControllers.nextAC = null;
		}
	};

	public resetMessagesFilter = () => {
		const streams = this.selectedStore.attachedMessages
			.map(m => m.sessionId)
			.filter((stream, index, self) => self.indexOf(stream) === index);
		this.filterStore.resetMessagesFilter(streams);
	};

	@action
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.messagesIds.indexOf(messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
			this.messagesLoadingState = defaultMessagesLoadingState;
			return;
		}

		this.resetMessagesState();
		this.messagesLoadingState.loadingRootItems = true;
		this.messagesLoadingState.loadingPreviousItems = true;
		this.messagesLoadingState.loadingNextItems = true;

		try {
			await this.loadPreviousMessages(false, messageId);
			this.scrolledIndex = this.messagesIds.indexOf(messageId);
			this.messagesLoadingState.loadingPreviousItems = false;
			this.messagesLoadingState.loadingRootItems = false;
		} catch (error) {
			if (error.name !== 'AbortError') {
				this.messagesLoadingState.loadingPreviousItems = false;
				this.messagesLoadingState.loadingRootItems = false;
				this.abortControllers.prevAC = null;
			}
		}
	};

	private previousAttachedMessages: EventMessage[] = [];

	@action
	private onAttachedMessagesChange = (attachedMessages: EventMessage[]) => {
		this.isBeginReached = false;
		this.isEndReached = false;

		const streams = [...new Set(attachedMessages.map(m => m.sessionId))];
		this.filterStore.messagesFilter.streams = streams;

		const targetMessageId = attachedMessages.filter(
			({ messageId }) =>
				this.previousAttachedMessages.findIndex(
					prevMessage => prevMessage.messageId === messageId,
				) === -1,
		)[0]?.messageId;

		this.previousAttachedMessages = attachedMessages;
		if (targetMessageId) {
			this.selectedMessageId = new String(targetMessageId);
			return;
		}
		if (
			attachedMessages.length > 0 &&
			!attachedMessages.some(msg => this.messagesIds.includes(msg.messageId))
		) {
			this.selectedMessageId = new String(attachedMessages[0].messageId);
		}
	};

	@action
	private resetMessagesState = () => {
		this.messagesIds = [];
		this.messagesCache.clear();
		this.scrolledIndex = null;
		this.isBeginReached = false;
		this.isEndReached = false;
		this.messagesLoadingState = defaultMessagesLoadingState;
	};

	@action
	private onFilterChange = async (messagesFilter: MessagesFilter) => {
		this.resetMessagesState();
		this.messagesLoadingState.loadingRootItems = true;

		let originMessageId: string | undefined = this.selectedStore.attachedMessages[0]?.messageId;

		if (
			this.selectedStore.attachedMessages.length &&
			(messagesFilter.timestampFrom || messagesFilter.timestampTo)
		) {
			const from = messagesFilter.timestampFrom || new Date(1980).getTime();
			const to =
				messagesFilter.timestampTo ||
				new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
			const firstMessage = this.selectedStore.attachedMessages.find(
				m => getTimestampAsNumber(m.timestamp) >= from && getTimestampAsNumber(m.timestamp) <= to,
			);
			originMessageId = firstMessage?.messageId;
		}

		try {
			await this.loadPreviousMessages(false, originMessageId);
		} finally {
			this.messagesLoadingState.loadingRootItems = false;
		}
	};

	@action
	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds);
		this.messagesCache = observable.map(toJS(store.messagesCache), { deep: false });
		this.beautifiedMessages = toJS(store.beautifiedMessages);
		this.detailedRawMessagesIds = toJS(store.detailedRawMessagesIds);
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId
			? new String(store.selectedMessageId.valueOf())
			: null;
		this.messagesLoadingState = toJS(store.messagesLoadingState);
		this.filterStore = new FilterStore({
			messagesFilter: toJS(store.filterStore.messagesFilter),
		});
		this.isEndReached = store.isEndReached.valueOf();
		this.isBeginReached = store.isBeginReached.valueOf();

		if (!store.messageSessions) {
			this.loadMessageSessions();
		} else {
			this.messageSessions = store.messageSessions.slice();
		}
	}
}
