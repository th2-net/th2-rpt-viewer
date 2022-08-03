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
import BooksStore from '../BooksStore';
import notificationsStore from '../NotificationsStore';
import { MessagesSSEChannel } from '../SSEChannel/MessagesSSEChannel';
import MessagesStore from './MessagesStore';
import MessagesUpdateStore from './MessagesUpdateStore';
import { SearchDirection } from '../../models/search/SearchDirection';

const SEARCH_TIME_FRAME = 15;
const FIFTEEN_SECONDS = 15 * 1000;

export default class MessagesDataProviderStore {
	private readonly messagesLimit = 250;

	constructor(
		private messagesStore: MessagesStore,
		private api: ApiSchema,
		private booksStore: BooksStore,
	) {
		this.updateStore = new MessagesUpdateStore(
			this,
			booksStore,
			this.messagesStore.scrollToMessage,
		);

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
	public anchorChannel: MessagesSSEChannel | null = null;

	@observable
	public isLoadingAnchorMessage = false;

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
		return (
			this.isLoadingNextMessages ||
			this.isLoadingPreviousMessages ||
			Boolean(this.anchorChannel?.isLoading) ||
			this.isLoadingAnchorMessage
		);
	}

	private messageAC: AbortController | null = null;

	@action
	public loadMessages = async () => {
		this.stopMessagesLoading();
		const bookId = this.booksStore.selectedBook.name;

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const queryParams = this.getFilterParams();

		this.createPreviousMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: SearchDirection.Previous,
				bookId,
			},
			{
				interval: SEARCH_TIME_FRAME,
			},
		);
		this.createNextMessageChannelEventSource(
			{
				...queryParams,
				searchDirection: SearchDirection.Next,
				bookId,
			},
			{
				interval: SEARCH_TIME_FRAME,
			},
		);

		let message: EventMessage | undefined;

		if (this.searchChannelPrev && this.searchChannelNext) {
			if (this.messagesStore.selectedMessageId) {
				this.isLoadingAnchorMessage = true;
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
						searchDirection: SearchDirection.Previous,
						bookId,
					},
					{
						onResponse: () => null,
						onError: this.onLoadingError,
					},
					{
						chunkSize: 1,
					},
				);
				[message] = await this.anchorChannel.loadAndSubscribe({ initialResponseTimeoutMs: null });
				if (!message) this.anchorChannel.stop();
				this.anchorChannel = null;
			}

			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.loadAndSubscribe({ resumeFromId: message?.messageId }),
				this.searchChannelPrev.loadAndSubscribe({ resumeFromId: message?.messageId }),
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
	public stopMessagesLoading = (isError = false) => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.anchorChannel?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.anchorChannel = null;
		this.resetMessagesDataState(isError);
	};

	@action
	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopMessagesLoading(true);
	};

	@action
	public createPreviousMessageChannelEventSource = (
		query: MessagesSSEParams,
		options?: {
			onClose?: () => void;
			interval?: number;
		},
	) => {
		this.searchChannelPrev = new MessagesSSEChannel(query, {
			onResponse: this.onPrevChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse:
				typeof options?.interval === 'number'
					? this.onKeepAliveMessagePrevious
					: e =>
							runInAction(() => {
								this.prevLoadHeartbeat = e;
							}),
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

	@action
	private onKeepAliveMessagePrevious = (e: SSEHeartbeat) => {
		this.prevLoadHeartbeat = e;

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
		options?: {
			onClose?: () => void;
			interval?: number;
		},
	) => {
		this.searchChannelNext = new MessagesSSEChannel(query, {
			onResponse: this.onNextChannelResponse,
			onError: this.onLoadingError,
			onKeepAliveResponse:
				typeof options?.interval === 'number'
					? this.onKeepAliveMessageNext
					: e =>
							runInAction(() => {
								this.nextLoadHeartbeat = e;
							}),
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
		const firstNextMessage = messages[messages.length - 1];

		if (firstNextMessage && firstNextMessage.messageId === this.messages[0]?.messageId) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.startIndex -= messages.length;

			let newMessagesList = [...messages, ...this.messages];

			if (newMessagesList.length > this.messagesLimit) {
				newMessagesList = newMessagesList.slice(0, this.messagesLimit);
			}
			this.messages = newMessagesList;
		}
	};

	@action
	private onKeepAliveMessageNext = (e: SSEHeartbeat) => {
		this.nextLoadHeartbeat = e;

		if (this.lastNextChannelResponseTimestamp === null) {
			this.lastNextChannelResponseTimestamp = Date.now();
		}
		if (
			this.lastNextChannelResponseTimestamp !== null &&
			Date.now() - this.lastNextChannelResponseTimestamp >= FIFTEEN_SECONDS
		) {
			this.noMatchingMessagesNext = true;
			this.searchChannelNext?.stop();
		}
	};

	@action
	public getPreviousMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (
			!this.searchChannelPrev ||
			this.searchChannelPrev.isLoading ||
			this.noMatchingMessagesPrev
		) {
			return [];
		}

		return this.searchChannelPrev.loadAndSubscribe({ resumeFromId });
	};

	@action
	public getNextMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (
			!this.searchChannelNext ||
			this.searchChannelNext.isLoading ||
			this.noMatchingMessagesNext
		) {
			return [];
		}

		return this.searchChannelNext.loadAndSubscribe({ resumeFromId });
	};

	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.updateStore.stopSubscription();
		this.resetMessagesDataState();
		this.loadMessages();
	};

	@action
	private resetMessagesDataState = (isError = false) => {
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
		this.isLoadingAnchorMessage = false;
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
	public keepLoading = async (direction: SearchDirection) => {
		const bookId = this.booksStore.selectedBook.name;
		if (
			this.messagesStore.filterStore.filter.streams.length === 0 ||
			!this.searchChannelNext ||
			!this.searchChannelPrev
		)
			return;

		if (!this.prevLoadHeartbeat && !this.nextLoadHeartbeat)
			throw new Error('Load could not continue because loadHeathbeat is missing');

		const queryParams = await this.messagesStore.filterStore.filterParams;

		const { stream, endTimestamp, resultCountLimit } = queryParams;

		const keepLoadingStartTimestamp =
			direction === SearchDirection.Previous
				? this.prevLoadHeartbeat!.timestamp
				: this.nextLoadHeartbeat!.timestamp;

		const query: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp: keepLoadingStartTimestamp,
					stream,
					searchDirection: direction,
					endTimestamp,
					resultCountLimit,
					bookId,
			  }
			: {
					...queryParams,
					startTimestamp: keepLoadingStartTimestamp,
					searchDirection: direction,
					bookId,
			  };

		if (direction === SearchDirection.Previous) {
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

		if (direction === SearchDirection.Previous) {
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
		const bookId = this.booksStore.selectedBook.name;
		if (this.isSoftFiltered.get(messageId) !== undefined) return;
		this.isMatchingMessages.set(messageId, true);

		try {
			const {
				resultCountLimit,
				resumeFromId,
				searchDirection,
				...filterParams
			} = this.messagesStore.filterStore.filterParams;
			const isMatch = await this.api.messages.matchMessage(
				messageId,
				{ ...filterParams, bookId },
				abortSignal,
			);

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
