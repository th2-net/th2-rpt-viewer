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

import { action, reaction, observable, computed, runInAction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import ApiSchema from '../../api/ApiSchema';
import { MessagesSSEParams, SSEHeartbeat } from '../../api/sse';
import { isAbortError } from '../../helpers/fetch';
import { EventMessage } from '../../models/EventMessage';
import notificationsStore from '../NotificationsStore';
import { MessageSSEEventListeners, MessagesSSEChannel } from '../SSEChannel/MessagesSSEChannel';
import MessagesStore from './MessagesStore';
import MessagesUpdateStore from './MessagesUpdateStore';
import { MessagesDataStore } from '../../models/Stores';
import { DirectionalStreamInfo } from '../../models/StreamInfo';
import { extractMessageIds } from '../../helpers/streamInfo';
import { timestampToNumber } from '../../helpers/date';

const FIFTEEN_SECONDS = 15 * 1000;

export default class MessagesDataProviderStore implements MessagesDataStore {
	constructor(private messagesStore: MessagesStore, private api: ApiSchema) {
		this.updateStore = new MessagesUpdateStore(this, this.messagesStore);

		reaction(() => this.messagesStore.filterStore.filter, this.onFilterChange);
	}

	public updateStore: MessagesUpdateStore;

	@observable
	public noMatchingMessagesPrev = false;

	@observable
	public noMatchingMessagesNext = false;

	@observable
	public messagesListErrorStatusCode: number | null = null;

	@observable.shallow
	public messages: Array<EventMessage> = [];

	@observable
	public isError = false;

	@observable
	public searchChannelPrev: MessagesSSEChannel | null = null;

	@observable
	public searchChannelNext: MessagesSSEChannel | null = null;

	@observable
	public startIndex = 10000;

	@observable
	public isSoftFiltered: Map<string, boolean> = new Map();

	@observable
	public isMatchingMessages: Map<string, boolean> = new Map();

	@observable
	public prevLoadHeartbeat: SSEHeartbeat | null = null;

	@observable
	public nextLoadHeartbeat: SSEHeartbeat | null = null;

	@observable
	private isLoadingMessageIds = false;

	private lastPreviousChannelResponseTimestamp: number | null = null;

	private lastNextChannelResponseTimestamp: number | null = null;

	@computed
	public get isLoadingNextMessages(): boolean {
		return Boolean(this.searchChannelNext?.isLoading);
	}

	@computed
	public get isLoadingPreviousMessages(): boolean {
		return Boolean(this.searchChannelPrev?.isLoading);
	}

	@computed
	public get isLoading(): boolean {
		return this.isLoadingNextMessages || this.isLoadingPreviousMessages || this.isLoadingMessageIds;
	}

	@computed
	public get sortedMessages() {
		return this.messages.sort(
			(a, b) => timestampToNumber(b.timestamp) - timestampToNumber(a.timestamp),
		);
	}

	private messageAC: AbortController | null = null;

	@action
	public loadMessages = async (
		nextListeners?: Partial<MessageSSEEventListeners>,
		prevListeners?: Partial<MessageSSEEventListeners>,
	) => {
		this.stopMessagesLoading();
		this.resetState();

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const queryParams = this.getFilterParams();

		this.createPreviousMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'previous',
			},
			FIFTEEN_SECONDS,
			prevListeners,
		);
		this.createNextMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'next',
			},
			FIFTEEN_SECONDS,
			nextListeners,
		);

		if (!this.searchChannelPrev || !this.searchChannelNext) return;

		const startTimestamp = queryParams.startTimestamp;

		let message: EventMessage | null = null;

		this.isLoadingMessageIds = true;

		let messageIds: DirectionalStreamInfo | undefined;

		if (this.messagesStore.selectedMessageId) {
			try {
				if (
					await this.api.messages.matchMessage(
						this.messagesStore.selectedMessageId.valueOf(),
						this.messagesStore.filterStore.filterParams,
					)
				) {
					this.messageAC = new AbortController();
					message = await this.api.messages.getMessage(
						this.messagesStore.selectedMessageId.valueOf(),
						this.messageAC.signal,
					);
				} else {
					this.messagesStore.selectedMessageId = null;
				}
			} catch (error) {
				if (!isAbortError(error)) {
					this.isError = true;
					return;
				}
			}
		}

		try {
			this.messageAC = new AbortController();
			messageIds = await this.api.messages.getResumptionMessageIds({
				streams: queryParams.stream,
				abortSignal: this.messageAC.signal,
				...(this.messagesStore.selectedMessageId
					? { messageId: this.messagesStore.selectedMessageId.valueOf() }
					: { startTimestamp }),
			});
		} catch (error) {
			if (!isAbortError(error)) {
				this.isError = true;
				return;
			}
		} finally {
			this.isLoadingMessageIds = false;
		}

		if (!messageIds) return;

		const [nextMessages, prevMessages] = await Promise.all([
			this.searchChannelNext.loadAndSubscribe({
				resumeMessageIds: extractMessageIds(messageIds.next),
			}),
			this.searchChannelPrev.loadAndSubscribe({
				resumeMessageIds: extractMessageIds(messageIds.previous),
			}),
		]);

		runInAction(() => {
			this.messages = [...nextMessages, ...prevMessages];
		});

		if (!this.messagesStore.selectedMessageId) {
			message = prevMessages[0] || nextMessages[nextMessages.length - 1];
			if (message) this.messagesStore.selectedMessageId = new String(message.messageId);
		}
	};

	@action
	public stopMessagesLoading = () => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
	};

	@action
	private onLoadingError = (event: Event) => {
		if (event instanceof MessageEvent) {
			notificationsStore.handleSSEError(event);
		} else {
			const evSource = toJS(event).currentTarget as EventSource;
			const errorId = nanoid();
			notificationsStore.addMessage({
				id: errorId,
				notificationType: 'genericError',
				header: 'Something went wrong while loading messages',
				type: 'error',
				action: {
					label: 'Refetch messages',
					callback: () => {
						notificationsStore.deleteMessage(errorId);
						this.loadMessages();
					},
				},
				description: evSource ? `${event.type} at ${evSource.url}` : `${event.type}`,
			});
		}
		this.stopMessagesLoading();
		this.resetState(true);
		this.updateStore.stopSubscription();
	};

	@action
	public createPreviousMessageChannelEventSource = (
		query: MessagesSSEParams,
		requestTimeoutMs?: number,
		listeners: Partial<MessageSSEEventListeners> = {},
	) => {
		this.searchChannelPrev = new MessagesSSEChannel(query, {
			onResponse: this.onPrevChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse: heartbeat =>
				this.onKeepAliveMessagePrevious(heartbeat, requestTimeoutMs),
			...listeners,
		});
	};

	@action
	private onKeepAliveMessagePrevious = (
		heartbeat: SSEHeartbeat,
		// Stops messages loading when requestTimeoutMs has passed since first heartbeat
		requestTimeoutMs?: number,
	) => {
		this.prevLoadHeartbeat = heartbeat;

		if (requestTimeoutMs) {
			if (this.lastPreviousChannelResponseTimestamp === null) {
				this.lastPreviousChannelResponseTimestamp = Date.now();
			}

			if (
				this.lastPreviousChannelResponseTimestamp !== null &&
				Date.now() - this.lastPreviousChannelResponseTimestamp >= FIFTEEN_SECONDS
			) {
				this.noMatchingMessagesPrev = true;
				this.searchChannelPrev?.stop();
			}
		}
	};

	@action
	public onPrevChannelResponse = (messages: EventMessage[]) => {
		// eslint-disable-next-line no-param-reassign
		messages = messages.filter(
			message => !this.messages.find(msg => msg.messageId === message.messageId),
		);

		this.lastPreviousChannelResponseTimestamp = null;
		const firstPrevMessage = messages[0];

		if (
			firstPrevMessage &&
			firstPrevMessage.messageId === this.messages[this.messages.length - 1]?.messageId
		) {
			messages.shift();
		}

		if (messages.length) {
			this.startIndex += messages.length;
			this.messages = [...this.messages, ...messages];
		}
	};

	@action
	public createNextMessageChannelEventSource = (
		query: MessagesSSEParams,
		requestTimeoutMs?: number,
		listeners: Partial<MessageSSEEventListeners> = {},
	) => {
		this.searchChannelNext = new MessagesSSEChannel(query, {
			onResponse: this.onNextChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse: hearbeat => this.onKeepAliveMessageNext(hearbeat, requestTimeoutMs),
			...listeners,
		});
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;

		const nextMessages = messages.filter(
			message => !this.messages.find(msg => msg.messageId === message.messageId),
		);

		if (nextMessages.length) {
			this.startIndex -= this.updateStore.isActive ? 0 : nextMessages.length;
			this.messages = [...nextMessages, ...this.messages];
		}
	};

	@action
	private onKeepAliveMessageNext = (
		heartbeat: SSEHeartbeat,
		// Stops messages loading when requestTimeoutMs has passed since first heartbeat
		requestTimeoutMs?: number,
	) => {
		this.nextLoadHeartbeat = heartbeat;

		if (requestTimeoutMs) {
			if (this.lastNextChannelResponseTimestamp === null) {
				this.lastNextChannelResponseTimestamp = Date.now();
			}
			if (
				this.lastNextChannelResponseTimestamp !== null &&
				Date.now() - this.lastNextChannelResponseTimestamp >= requestTimeoutMs
			) {
				this.noMatchingMessagesNext = true;
				this.searchChannelNext?.stop();
			}
		}
	};

	@action
	public getPreviousMessages = async (): Promise<EventMessage[]> => {
		if (
			!this.searchChannelPrev ||
			this.searchChannelPrev.isLoading ||
			this.noMatchingMessagesPrev
		) {
			return [];
		}

		return this.searchChannelPrev.loadAndSubscribe();
	};

	@action
	public getNextMessages = async (): Promise<EventMessage[]> => {
		if (
			!this.searchChannelNext ||
			this.searchChannelNext.isLoading ||
			this.noMatchingMessagesNext
		) {
			return [];
		}

		return this.searchChannelNext.loadAndSubscribe();
	};

	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.updateStore.stopSubscription();
		this.loadMessages();
	};

	@action
	public resetState = (isError = false) => {
		this.startIndex = 10000;
		this.messages = [];
		this.isError = isError;
		this.isSoftFiltered.clear();
		this.isMatchingMessages.clear();
		this.noMatchingMessagesNext = false;
		this.noMatchingMessagesPrev = false;
		this.prevLoadHeartbeat = null;
		this.nextLoadHeartbeat = null;
		this.lastPreviousChannelResponseTimestamp = null;
		this.lastNextChannelResponseTimestamp = null;
	};

	@observable
	public messagesCache: Map<string, EventMessage> = observable.map(new Map(), { deep: false });

	@action
	public fetchMessage = async (id: string, abortSingal: AbortSignal) => {
		let message = this.messagesCache.get(id);

		if (!message) {
			message = await this.api.messages.getMessage(id, abortSingal);
			this.messagesCache.set(id, message);
		}

		return message;
	};

	@action
	public getFilterParams = () =>
		this.messagesStore.filterStore.isSoftFilter
			? this.messagesStore.filterStore.softFilterParams
			: this.messagesStore.filterStore.filterParams;

	@action
	public keepLoading = (direction: 'next' | 'previous') => {
		if (
			this.messagesStore.filterStore.filter.streams.length === 0 ||
			!this.searchChannelNext ||
			!this.searchChannelPrev
		)
			return;

		if (!this.prevLoadHeartbeat && !this.nextLoadHeartbeat)
			throw new Error('Load could not continue because loadHeartbeat is missing');

		const keepLoadingStartTimestamp =
			direction === 'previous'
				? this.prevLoadHeartbeat!.timestamp
				: this.nextLoadHeartbeat!.timestamp;

		const defaultHearbeat = {
			timestamp: keepLoadingStartTimestamp,
			scanCounter: 0,
			id: '',
		};

		if (direction === 'previous') {
			this.prevLoadHeartbeat = defaultHearbeat;
		} else {
			this.nextLoadHeartbeat = defaultHearbeat;
		}

		if (direction === 'previous') {
			this.noMatchingMessagesPrev = false;
			const idsMap = this.messages
				.slice(Math.max(0, this.messages.length - 20))
				.reduce((map, m) => ({ ...map, [m.messageId]: true }), {} as Record<string, boolean>);
			this.searchChannelPrev.refetch({
				onResponse: messages =>
					this.onPrevChannelResponse(messages.filter(m => !idsMap[m.messageId])),
				onError: this.onLoadingError,
				onKeepAliveResponse: heartbeat => this.onKeepAliveMessagePrevious(heartbeat),
			});
		} else {
			this.noMatchingMessagesNext = false;
			const idsMap = this.messages
				.slice(0, 20)
				.reduce((map, m) => ({ ...map, [m.messageId]: true }), {} as Record<string, boolean>);
			this.searchChannelNext.refetch({
				onResponse: messages =>
					this.onNextChannelResponse(messages.filter(m => !idsMap[m.messageId])),
				onError: this.onLoadingError,
				onKeepAliveResponse: heartbeat => this.onKeepAliveMessageNext(heartbeat),
			});
		}
	};

	@action
	public matchMessage = async (messageId: string, abortSignal: AbortSignal) => {
		if (this.isSoftFiltered.get(messageId) !== undefined) return;
		this.isMatchingMessages.set(messageId, true);

		try {
			const { resultCountLimit, searchDirection, ...filterParams } =
				this.messagesStore.filterStore.filterParams;
			const isMatch = await this.api.messages.matchMessage(messageId, filterParams, abortSignal);

			runInAction(() => {
				this.isSoftFiltered.set(messageId, isMatch);
				this.isMatchingMessages.set(messageId, false);
			});
		} catch (error) {
			runInAction(() => {
				if (!isAbortError(error)) {
					this.isSoftFiltered.set(messageId, false);
				}
				this.isMatchingMessages.set(messageId, false);
			});
		}
	};
}
