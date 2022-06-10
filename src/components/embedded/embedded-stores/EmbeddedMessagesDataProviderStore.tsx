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
import { MessagesSSEParams, SSEHeartbeat } from '../../../api/sse';
import { EventMessage } from '../../../models/EventMessage';
import EmbeddedMessagesStore from './EmbeddedMessagesStore';
import ApiSchema from '../../../api/ApiSchema';
import notificationsStore from '../../../stores/NotificationsStore';
import { isEventMessage } from '../../../helpers/event';
import { isAbortError } from '../../../helpers/fetch';
import { MessagesDataStore } from '../../../models/Stores';
import MessagesUpdateStore from '../../../stores/messages/MessagesUpdateStore';
import { MessagesSSEChannel } from '../../../stores/SSEChannel/MessagesSSEChannel';
import { DirectionalStreamInfo } from '../../../models/StreamInfo';
import { extractMessageIds } from '../../../helpers/streamInfo';

const SEARCH_TIME_FRAME = 15;
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

	public getFilterParams = () => {
		return this.messagesStore.filterStore.filterParams;
	};

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
			{
				interval: SEARCH_TIME_FRAME,
				onClose: () =>
					!this.searchChannelNext?.isLoading &&
					!this.updateStore.isLoading &&
					this.updateStore.subscribeOnChanges(),
			},
		);
		this.createNextMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: 'next',
			},
			{
				interval: SEARCH_TIME_FRAME,
				onClose: () =>
					!this.searchChannelPrev?.isLoading &&
					!this.updateStore.isLoading &&
					this.updateStore.subscribeOnChanges(),
			},
		);

		if (!this.searchChannelPrev || !this.searchChannelNext) return;

		const startTimestamp = queryParams.startTimestamp;

		let message: EventMessage | null = null;

		this.isLoadingMessageIds = true;

		let messageIds: DirectionalStreamInfo | undefined;

		if (this.messagesStore.selectedMessageId) {
			try {
				this.messageAC = new AbortController();
				message = await this.api.messages.getMessage(
					this.messagesStore.selectedMessageId.valueOf(),
					this.messageAC.signal,
				);
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
				resumeMessageIds: extractMessageIds(messageIds.previous),
			}),
			this.searchChannelPrev.loadAndSubscribe({
				resumeMessageIds: extractMessageIds(messageIds.next),
			}),
		]);

		runInAction(() => {
			const messages = [...nextMessages, ...[message].filter(isEventMessage), ...prevMessages];
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
	};

	@action
	public stopMessagesLoading = () => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.isLoadingMessageIds = false;
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.updateStore.stopSubscription();
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
		options?: {
			onClose?: () => void;
			interval?: number;
		},
	) => {
		this.prevLoadEndTimestamp = null;

		this.searchChannelPrev = new MessagesSSEChannel(query, {
			onResponse: this.onPrevChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse:
				typeof options?.interval === 'number' ? this.onKeepAliveMessagePrevious : undefined,
			...(options?.onClose
				? {
						onClose: messages => {
							this.onPrevChannelResponse(messages);
							options.onClose?.();
						},
				  }
				: {}),
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
		options?: {
			onClose?: () => void;
			interval?: number;
		},
	) => {
		this.nextLoadEndTimestamp = null;

		this.searchChannelNext = new MessagesSSEChannel(query, {
			onResponse: messages => {
				this.onNextChannelResponse(messages);
			},
			onError: this.onLoadingError,
			onKeepAliveResponse:
				typeof options?.interval === 'number' ? this.onKeepAliveMessageNext : undefined,
			...(options?.onClose
				? {
						onClose: messages => {
							this.onNextChannelResponse(messages);
							options.onClose?.();
						},
				  }
				: {}),
		});
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;
		const firstNextMessage = messages[this.messages.length - 1];

		if (firstNextMessage && firstNextMessage.id === this.messages[0]?.id) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.startIndex -= messages.length;

			let newMessagesList = [...messages, ...this.messages];

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
		this.resetMessagesDataState();
		this.loadMessages();
	};

	@action
	public resetMessagesDataState = (isError = false) => {
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
