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
import { runInAction, action, observable, computed, autorun } from 'mobx';
import { sortByTimestamp, timestampToNumber } from 'helpers/date';
import { MessagesSSEParams, SSEHeartbeat } from '../../../api/sse';
import { EventMessage } from '../../../models/EventMessage';
import EmbeddedMessagesStore from './EmbeddedMessagesStore';
import ApiSchema from '../../../api/ApiSchema';
import notificationsStore from '../../../stores/NotificationsStore';
import { isEventMessage } from '../../../helpers/message';
import { isAbortError } from '../../../helpers/fetch';
import { MessagesDataStore } from '../../../models/Stores';
import MessagesUpdateStore from '../../../stores/messages/MessagesUpdateStore';
import {
	MessagesSSEChannel,
	MessageSSEEventListeners,
} from '../../../stores/SSEChannel/MessagesSSEChannel';
import { DirectionalStreamInfo } from '../../../models/StreamInfo';
import { extractMessageIds } from '../../../helpers/streamInfo';

const FIFTEEN_SECONDS = 15 * 1000;

export default class EmbeddedMessagesDataProviderStore implements MessagesDataStore {
	private readonly messagesLimit = 250;

	constructor(private messagesStore: EmbeddedMessagesStore, private api: ApiSchema) {
		this.updateStore = new MessagesUpdateStore(this, this.messagesStore);

		autorun(() => this.messagesStore.filterStore.filter && this.onFilterChange());
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
	public isMatchingMessages: Map<string, boolean> = new Map();

	prevLoadEndTimestamp: number | null = null;

	nextLoadEndTimestamp: number | null = null;

	private lastPreviousChannelResponseTimestamp: number | null = null;

	private lastNextChannelResponseTimestamp: number | null = null;

	@observable
	private isLoadingMessageIds = false;

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
		return (
			this.isLoadingNextMessages ||
			this.isLoadingPreviousMessages ||
			Boolean(this.isLoadingMessageIds)
		);
	}

	private messageAC: AbortController | null = null;

	public getFilterParams = () => this.messagesStore.filterStore.filterParams;

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

		const messageId = this.messagesStore.selectedMessageId?.valueOf();
		let message: EventMessage | null = null;

		this.isLoadingMessageIds = true;

		let messageIds: DirectionalStreamInfo | undefined;

		try {
			this.messageAC = new AbortController();
			[message, messageIds] = await Promise.all([
				messageId ? this.api.messages.getMessage(messageId, this.messageAC.signal) : null,
				this.api.messages.getResumptionMessageIds(
					{
						streams: queryParams.stream,
						messageId,
						startTimestamp: messageId ? queryParams.startTimestamp : undefined,
					},
					this.messageAC.signal,
				),
			]);

			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.loadAndSubscribe({
					resumeMessageIds: extractMessageIds(messageIds.next),
				}),
				this.searchChannelPrev.loadAndSubscribe({
					resumeMessageIds: extractMessageIds(messageIds.previous),
				}),
			]);

			runInAction(() => {
				const messages = sortByTimestamp([
					...nextMessages.filter(msg => msg.id !== messageId),
					...[message].filter(isEventMessage),
					...prevMessages,
				]);
				this.messages = messages;
			});

			if (this.messagesStore.selectedMessageId) {
				this.messagesStore.scrollToMessage(this.messagesStore.selectedMessageId?.valueOf());
			} else {
				const firstPrevMessage = prevMessages[0];
				if (firstPrevMessage) {
					this.messagesStore.scrollToMessage(firstPrevMessage.id);
				}
			}
		} catch (error) {
			if (!isAbortError(error)) {
				this.isError = true;
				return;
			}
		} finally {
			this.isLoadingMessageIds = false;
		}
	};

	@action
	public stopMessagesLoading = () => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.isLoadingMessageIds = false;
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
	};

	@action
	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopMessagesLoading();
		this.resetState(true);
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
			onKeepAliveResponse: heartbeat => this.onKeepAliveMessagePrevious(heartbeat),
			...listeners,
		});
	};

	private onKeepAliveMessagePrevious = (e: SSEHeartbeat) => {
		if (this.lastPreviousChannelResponseTimestamp === null) {
			this.lastPreviousChannelResponseTimestamp = Date.now();
		}
		if (
			this.lastPreviousChannelResponseTimestamp !== null &&
			Date.now() - this.lastPreviousChannelResponseTimestamp >= FIFTEEN_SECONDS
		) {
			runInAction(() => {
				this.noMatchingMessagesPrev = true;
				this.prevLoadEndTimestamp = e.timestamp;
				this.searchChannelPrev?.stop();
			});
		}
	};

	@action
	public onPrevChannelResponse = (messages: EventMessage[]) => {
		this.lastPreviousChannelResponseTimestamp = null;
		const firstPrevMessage = messages[0];

		if (firstPrevMessage && firstPrevMessage.id === this.messages[this.messages.length - 1]?.id) {
			messages.shift();
		}

		if (messages.length) {
			let newMessagesList = [...this.messages, ...messages];

			if (newMessagesList.length > this.messagesLimit) {
				newMessagesList = newMessagesList.slice(-this.messagesLimit);
			}

			this.messages = newMessagesList;

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.id === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
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
			onKeepAliveResponse: hearbeat => this.onKeepAliveMessageNext(hearbeat),
			...listeners,
		});
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;
		const prevMessages =
			this.messages.length > 0
				? messages.filter(
						message =>
							timestampToNumber(message.timestamp) <
								timestampToNumber(this.messages[0].timestamp) || message.id === this.messages[0].id,
				  )
				: [];
		const firstNextMessage = messages[this.messages.length - 1];

		const nextMessages = messages.slice(0, messages.length - prevMessages.length);

		if (firstNextMessage && firstNextMessage.id === this.messages[0]?.id) {
			prevMessages.shift();
		}

		if (prevMessages.length > 0 || nextMessages.length > 0) {
			this.startIndex -= nextMessages.length;

			let newMessagesList = prevMessages.length
				? [...nextMessages, this.messages[0], ...prevMessages, ...this.messages.slice(1)]
				: [...nextMessages, ...this.messages];

			if (newMessagesList.length > this.messagesLimit) {
				newMessagesList = newMessagesList.slice(0, this.messagesLimit);
			}
			this.messages = newMessagesList;

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.id === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	private onKeepAliveMessageNext = (e: SSEHeartbeat) => {
		if (this.lastNextChannelResponseTimestamp === null) {
			this.lastNextChannelResponseTimestamp = Date.now();
		}
		if (
			this.lastNextChannelResponseTimestamp !== null &&
			Date.now() - this.lastNextChannelResponseTimestamp >= FIFTEEN_SECONDS
		) {
			runInAction(() => {
				this.noMatchingMessagesNext = true;
				this.nextLoadEndTimestamp = e.timestamp;
				this.searchChannelNext?.stop();
			});
		}
	};

	@action
	public getPreviousMessages = async (): Promise<EventMessage[]> => {
		if (!this.searchChannelPrev || this.searchChannelPrev.isLoading) {
			return [];
		}

		return this.searchChannelPrev.loadAndSubscribe();
	};

	@action
	public getNextMessages = async (): Promise<EventMessage[]> => {
		if (!this.searchChannelNext || this.searchChannelNext.isLoading) {
			return [];
		}

		return this.searchChannelNext.loadAndSubscribe();
	};

	@action
	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.resetState();
		this.updateStore.subscribeOnChanges();
	};

	@action
	public resetState = (isError = false) => {
		this.startIndex = 10000;
		this.messages = [];
		this.isError = isError;
		this.isMatchingMessages.clear();
		this.noMatchingMessagesNext = false;
		this.noMatchingMessagesPrev = false;
		this.prevLoadEndTimestamp = null;
		this.nextLoadEndTimestamp = null;
		this.lastPreviousChannelResponseTimestamp = null;
		this.lastNextChannelResponseTimestamp = null;
	};

	@action
	public keepLoading = (direction: 'next' | 'previous') => {
		if (
			!this.searchChannelNext ||
			!this.searchChannelPrev ||
			(!this.prevLoadEndTimestamp && !this.nextLoadEndTimestamp)
		)
			return;

		const queryParams = this.messagesStore.filterStore.filterParams;

		const query: MessagesSSEParams = {
			...queryParams,
			startTimestamp:
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				direction === 'previous' ? this.prevLoadEndTimestamp! : this.nextLoadEndTimestamp!,
			searchDirection: direction,
		};

		if (direction === 'previous') {
			this.noMatchingMessagesPrev = false;
			this.createPreviousMessageChannelEventSource(query);
			this.searchChannelPrev.subscribe();
		} else {
			this.noMatchingMessagesNext = false;
			this.createNextMessageChannelEventSource(query);
			this.searchChannelNext.subscribe();
		}
	};
}
