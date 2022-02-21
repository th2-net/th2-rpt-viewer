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

import { action, reaction, observable, computed, runInAction } from 'mobx';
import ApiSchema from '../../api/ApiSchema';
import { MessagesSSEParams, SSEHeartbeat } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { isAbortError } from '../../helpers/fetch';
import { EventMessage } from '../../models/EventMessage';
import notificationsStore from '../NotificationsStore';
import { MessagesSSEChannel } from '../SSEChannel/MessagesSSEChannel';
import MessagesStore from './MessagesStore';
import MessagesUpdateStore from './MessagesUpdateStore';
import ResumeMessageIdsStore from './ResumeMessageIdsStore';
import { MessagesDataStore } from '../../models/Stores';

const FIFTEEN_SECONDS = 15 * 1000;

export default class MessagesDataProviderStore implements MessagesDataStore {
	private readonly messagesLimit = 250;

	constructor(private messagesStore: MessagesStore, private api: ApiSchema) {
		this.updateStore = new MessagesUpdateStore(this, this.messagesStore);

		reaction(() => this.messagesStore.filterStore.filter, this.onFilterChange);

		reaction(() => this.searchChannelPrev, this.resumeMessageIdsPrev.reset);

		reaction(() => this.searchChannelNext, this.resumeMessageIdsNext.reset);
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
	public initialItemCount = 0;

	@observable
	public isSoftFiltered: Map<string, boolean> = new Map();

	@observable
	public isMatchingMessages: Map<string, boolean> = new Map();

	@observable
	public prevLoadHeartbeat: SSEHeartbeat | null = null;

	@observable
	public nextLoadHeartbeat: SSEHeartbeat | null = null;

	@observable
	private isLoadingAnchorMessage = false;

	public anchorChannel: MessagesSSEChannel | null = null;

	private lastPreviousChannelResponseTimestamp: number | null = null;

	private lastNextChannelResponseTimestamp: number | null = null;

	public resumeMessageIdsPrev = new ResumeMessageIdsStore();

	public resumeMessageIdsNext = new ResumeMessageIdsStore();

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
			this.isLoadingNextMessages || this.isLoadingPreviousMessages || this.isLoadingAnchorMessage
		);
	}

	private messageAC: AbortController | null = null;

	@action
	public loadMessages = async () => {
		this.stopMessagesLoading();
		this.resetMessagesDataState();

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const queryParams = this.getFilterParams();

		this.createPreviousMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'previous',
			},
			FIFTEEN_SECONDS,
		);
		this.createNextMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'next',
			},
			FIFTEEN_SECONDS,
		);

		let message: EventMessage | undefined;

		if (this.searchChannelPrev && this.searchChannelNext) {
			this.isLoadingAnchorMessage = true;
			if (this.messagesStore.selectedMessageId) {
				this.messageAC = new AbortController();
				try {
					message = await this.api.messages.getMessage(
						this.messagesStore.selectedMessageId.valueOf(),
						this.messageAC.signal,
					);
				} catch (error) {
					if (!isAbortError(error)) {
						this.isError = true;
						return;
					}
				} finally {
					this.isLoadingAnchorMessage = false;
				}
			} else {
				this.anchorChannel = new MessagesSSEChannel(
					{
						...queryParams,
						searchDirection: 'previous',
					},
					{
						onResponse: () => null,
						onError: this.onLoadingError,
					},
					{
						chunkSize: 1,
					},
				);
				try {
					[message] = await this.anchorChannel.loadAndSubscribe({ initialResponseTimeoutMs: null });
					if (!message) this.anchorChannel.stop();
					this.anchorChannel = null;
				} finally {
					this.isLoadingAnchorMessage = false;
				}
			}

			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.loadAndSubscribe({
					resumeMessageIds: message && [message.messageId],
				}),
				this.searchChannelPrev.loadAndSubscribe({
					resumeMessageIds: message && [message.messageId],
				}),
			]);

			const firstNextMessage = nextMessages[nextMessages.length - 1];

			if (firstNextMessage && firstNextMessage.messageId === prevMessages[0]?.messageId) {
				nextMessages.pop();
			}

			runInAction(() => {
				const messages = [...nextMessages, ...[message].filter(isEventMessage), ...prevMessages];
				this.messages = messages;
				this.initialItemCount = messages.length;
			});

			if (!this.messagesStore.selectedMessageId) {
				const selectedMessage = prevMessages[0] || nextMessages[nextMessages.length - 1];
				if (selectedMessage)
					this.messagesStore.selectedMessageId = new String(selectedMessage.messageId);
			}
		}

		if (this.messagesStore.filterStore.isSoftFilter && message) {
			this.isSoftFiltered.set(message.messageId, true);
		}
	};

	@action
	public stopMessagesLoading = () => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.anchorChannel?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.anchorChannel = null;
	};

	@action
	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopMessagesLoading();
		this.resetMessagesDataState(true);
	};

	@action
	public createPreviousMessageChannelEventSource = (
		query: MessagesSSEParams,
		requestTimeoutMs?: number,
		onCloseHandler?: () => void,
	) => {
		const onClose =
			onCloseHandler &&
			((messages: EventMessage[]) => {
				this.onPrevChannelResponse(messages);
				onCloseHandler();
			});

		this.searchChannelPrev = new MessagesSSEChannel(query, {
			onResponse: this.onPrevChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse: heartbeat =>
				this.onKeepAliveMessagePrevious(heartbeat, requestTimeoutMs),
			onClose,
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
		this.lastPreviousChannelResponseTimestamp = null;
		const firstPrevMessage = messages[0];

		if (
			firstPrevMessage &&
			firstPrevMessage.messageId === this.messages[this.messages.length - 1]?.messageId
		) {
			messages.shift();
		}

		if (messages.length) {
			this.resumeMessageIdsPrev.updateMessageIdsByMessageList(messages);
			let newMessagesList = [...this.messages, ...messages];

			if (newMessagesList.length > this.messagesLimit) {
				newMessagesList = newMessagesList.slice(-this.messagesLimit);
			}

			this.messages = newMessagesList;
		}
	};

	@action
	public createNextMessageChannelEventSource = (
		query: MessagesSSEParams,
		requestTimeoutMs?: number,
		onCloseHandler?: () => void,
	) => {
		const onClose =
			onCloseHandler &&
			((messages: EventMessage[]) => {
				this.onNextChannelResponse(messages);
				onCloseHandler();
			});
		this.searchChannelNext = new MessagesSSEChannel(query, {
			onResponse: this.onNextChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse: hearbeat => this.onKeepAliveMessageNext(hearbeat, requestTimeoutMs),
			onClose,
		});
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;
		const firstNextMessage = messages[messages.length - 1];

		if (firstNextMessage && firstNextMessage.messageId === this.messages[0]?.messageId) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.resumeMessageIdsNext.updateMessageIdsByMessageList([...messages].reverse());
			this.startIndex -= messages.length;

			let newMessagesList = [...messages, ...this.messages];

			if (newMessagesList.length > this.messagesLimit) {
				newMessagesList = newMessagesList.slice(0, this.messagesLimit);
			}
			this.messages = newMessagesList;
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

		return this.searchChannelPrev.loadAndSubscribe({
			resumeMessageIds: this.resumeMessageIdsPrev.idList,
		});
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

		return this.searchChannelNext.loadAndSubscribe({
			resumeMessageIds: this.resumeMessageIdsNext.idList,
		});
	};

	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.updateStore.stopSubscription();
		this.loadMessages();
	};

	@action
	public resetMessagesDataState = (isError = false) => {
		this.initialItemCount = 0;
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
	public getFilterParams = () => {
		return this.messagesStore.filterStore.isSoftFilter
			? this.messagesStore.filterStore.softFilterParams
			: this.messagesStore.filterStore.filterParams;
	};

	@action
	public keepLoading = (direction: 'next' | 'previous') => {
		if (
			this.messagesStore.filterStore.filter.streams.length === 0 ||
			!this.searchChannelNext ||
			!this.searchChannelPrev
		)
			return;

		if (!this.prevLoadHeartbeat && !this.nextLoadHeartbeat)
			throw new Error('Load could not continue because loadHeathbeat is missing');

		const queryParams = this.messagesStore.filterStore.filterParams;

		const { stream, endTimestamp, resultCountLimit } = queryParams;

		const keepLoadingStartTimestamp =
			direction === 'previous'
				? this.prevLoadHeartbeat!.timestamp
				: this.nextLoadHeartbeat!.timestamp;

		const query: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp: keepLoadingStartTimestamp,
					stream,
					searchDirection: direction,
					endTimestamp,
					resultCountLimit,
			  }
			: {
					...queryParams,
					startTimestamp: keepLoadingStartTimestamp,
					searchDirection: direction,
			  };

		if (direction === 'previous') {
			this.prevLoadHeartbeat = {
				timestamp: keepLoadingStartTimestamp,
				scanCounter: 0,
				id: '',
			};
		} else {
			this.nextLoadHeartbeat = {
				timestamp: keepLoadingStartTimestamp,
				scanCounter: 0,
				id: '',
			};
		}

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

	@action
	public matchMessage = async (messageId: string, abortSignal: AbortSignal) => {
		if (this.isSoftFiltered.get(messageId) !== undefined) return;
		this.isMatchingMessages.set(messageId, true);

		try {
			const {
				resultCountLimit,
				searchDirection,
				...filterParams
			} = this.messagesStore.filterStore.filterParams;
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
