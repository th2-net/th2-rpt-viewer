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
import { MessagesSSEParams } from '../../api/sse';
import { timestampToNumber } from '../../helpers/date';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import notificationsStore from '../NotificationsStore';
import MessagesStore from './MessagesStore';
import { MessagesSSELoader } from './MessagesSSELoader';

const SEARCH_TIME_FRAME = 15;
const FIFTEEN_SECONDS = 15 * 1000;

export default class MessagesDataProviderStore {
	constructor(private messagesStore: MessagesStore, private api: ApiSchema) {
		reaction(() => this.messagesStore.filterStore.filter, this.onFilterChange);

		reaction(() => this.messages, this.syncFetchedMessagesWithSoftFiltered);

		reaction(() => this.softFilterResults, this.syncFetchedMessagesWithSoftFiltered);
	}

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

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
	public searchChannelPrev: MessagesSSELoader | null = null;

	@observable
	public searchChannelNext: MessagesSSELoader | null = null;

	@observable
	public startIndex = 10000;

	@observable
	public initialItemCount = 0;

	@observable.shallow
	public softFilterResults: Array<EventMessage> = [];

	@observable
	public softFilterChannelPrev: MessagesSSELoader | null = null;

	@observable
	public softFilterChannelNext: MessagesSSELoader | null = null;

	prevLoadEndTimestamp: number | null = null;

	nextLoadEndTimestamp: number | null = null;

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
		return this.isLoadingNextMessages || this.isLoadingPreviousMessages;
	}

	@computed
	public get isLoadingSoftFilteredMessages(): boolean {
		return (
			Boolean(this.softFilterChannelPrev?.isLoading) ||
			Boolean(this.softFilterChannelNext?.isLoading)
		);
	}

	private messageAC: AbortController | null = null;

	@action
	public loadMessages = async () => {
		this.stopMessagesLoading();

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const queryParams = this.messagesStore.filterStore.messsagesSSEConfig
			.queryParams as MessagesSSEParams;

		const { startTimestamp, stream, endTimestamp, resultCountLimit, resumeFromId } = queryParams;

		const prevQuery: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp,
					stream,
					searchDirection: 'previous',
					endTimestamp,
					resultCountLimit,
					resumeFromId,
			  }
			: queryParams;

		const nextQuery: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp,
					stream,
					searchDirection: 'next',
					endTimestamp,
					resultCountLimit,
					resumeFromId,
			  }
			: {
					...queryParams,
					searchDirection: 'next',
			  };

		this.startPreviousMessagesChannel(prevQuery, SEARCH_TIME_FRAME);
		this.startNextMessagesChannel(nextQuery, SEARCH_TIME_FRAME);

		let message: EventMessage | undefined;
		if (this.searchChannelPrev && this.searchChannelNext) {
			if (this.messagesStore.selectedMessageId) {
				this.messageAC = new AbortController();
				try {
					message = await this.api.messages.getMessage(
						this.messagesStore.selectedMessageId.valueOf(),
						this.messageAC.signal,
					);
				} catch (error) {
					if (error.name !== 'AbortError') {
						this.isError = true;
						return;
					}
				}
			}
			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.loadAndSubscribe(message?.messageId),
				this.searchChannelPrev.loadAndSubscribe(message?.messageId),
			]);

			const firstNextMessage = nextMessages[nextMessages.length - 1];

			if (firstNextMessage && firstNextMessage.messageId === prevMessages[0]?.messageId) {
				nextMessages.pop();
			}

			runInAction(() => {
				this.messages = [...nextMessages, ...[message].filter(isEventMessage), ...prevMessages];
				this.initialItemCount = this.messages.length;
			});

			if (this.messagesStore.selectedMessageId) {
				this.messagesStore.scrollToMessage(this.messagesStore.selectedMessageId?.valueOf());
			} else {
				const firstPrevMessage = prevMessages[0];
				if (firstPrevMessage) {
					this.messagesStore.scrollToMessage(firstPrevMessage.messageId);
				}
			}
		}

		if (this.messagesStore.filterStore.isSoftFilter) {
			if (message) {
				this.softFilterResults = [message];
			}
			this.startNextSoftFilterChannel(
				{
					...queryParams,
					searchDirection: 'next',
				},
				SEARCH_TIME_FRAME,
			);
			this.startPrevSoftFilterChannel(
				{
					...queryParams,
					searchDirection: 'previous',
				},
				SEARCH_TIME_FRAME,
			);

			this.softFilterChannelNext?.subscribe(message?.messageId);
			this.softFilterChannelPrev?.subscribe(message?.messageId);
		}
	};

	@action
	public stopMessagesLoading = (isError = false) => {
		this.messageAC?.abort();
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.softFilterChannelPrev?.stop();
		this.softFilterChannelNext?.stop();
		this.softFilterChannelPrev = null;
		this.softFilterChannelNext = null;
		this.resetMessagesDataState(isError);
	};

	@action
	public startPreviousMessagesChannel = (query: MessagesSSEParams, interval?: number) => {
		this.prevLoadEndTimestamp = null;

		this.searchChannelPrev = new MessagesSSELoader(
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onPrevChannelResponse,
			this.onLoadingError,
			interval
				? e => {
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
				  }
				: undefined,
		);
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
			this.messages = [...this.messages, ...messages];

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.messageId === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	@action
	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopMessagesLoading(true);
	};

	@action
	public startNextMessagesChannel = (query: MessagesSSEParams, interval?: number) => {
		this.nextLoadEndTimestamp = null;

		this.searchChannelNext = new MessagesSSELoader(
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onNextChannelResponse,
			this.onLoadingError,
			interval
				? e => {
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
				  }
				: undefined,
		);
	};

	@action
	public onNextChannelResponse = (messages: EventMessage[]) => {
		this.lastNextChannelResponseTimestamp = null;
		const firstNextMessage = messages[this.messages.length - 1];

		if (firstNextMessage && firstNextMessage.messageId === this.messages[0]?.messageId) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.startIndex -= messages.length;
			this.messages = [...messages, ...this.messages];

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.messageId === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	@action
	public getPreviousMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelPrev || this.searchChannelPrev.isLoading) {
			return [];
		}

		return this.searchChannelPrev.loadAndSubscribe(resumeFromId);
	};

	@action
	public getNextMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelNext || this.searchChannelNext.isLoading) {
			return [];
		}

		return this.searchChannelNext.loadAndSubscribe(resumeFromId);
	};

	@action
	private startNextSoftFilterChannel = (query: MessagesSSEParams, interval?: number) => {
		this.softFilterChannelNext = new MessagesSSELoader(
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onNextSoftFilterChannelResponse,
			this.onLoadingError,
			interval
				? e => {
						const lastFetchedMessage = this.messages[0];

						if (
							this.searchChannelNext?.isLoading === false &&
							lastFetchedMessage &&
							e.timestamp > timestampToNumber(lastFetchedMessage.timestamp)
						) {
							this.softFilterChannelNext?.stop();
						}
				  }
				: undefined,
		);
	};

	@action
	private startPrevSoftFilterChannel = (query: MessagesSSEParams, interval?: number) => {
		this.softFilterChannelPrev = new MessagesSSELoader(
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onPrevSoftFilterChannelResponse,
			this.onLoadingError,
			interval
				? e => {
						const firstFetchedMessage = this.messages[this.messages.length - 1];

						if (
							this.searchChannelPrev?.isLoading === false &&
							firstFetchedMessage &&
							e.timestamp < timestampToNumber(firstFetchedMessage.timestamp)
						) {
							this.softFilterChannelPrev?.stop();
						}
				  }
				: undefined,
		);
	};

	@action
	private onNextSoftFilterChannelResponse = (messages: EventMessage[]) => {
		const firstNextMessage = messages[this.messages.length - 1];

		if (firstNextMessage && firstNextMessage.messageId === this.softFilterResults[0]?.messageId) {
			messages.pop();
		}

		if (messages.length !== 0) {
			this.softFilterResults = [...messages, ...this.softFilterResults];
		}
	};

	@action
	private onPrevSoftFilterChannelResponse = (messages: EventMessage[]) => {
		const firstPrevMessage = messages[0];

		if (
			firstPrevMessage &&
			firstPrevMessage.messageId ===
				this.softFilterResults[this.softFilterResults.length - 1]?.messageId
		) {
			messages.shift();
		}

		if (messages.length !== 0) {
			this.softFilterResults = [...this.softFilterResults, ...messages];
		}
	};

	@action
	private syncFetchedMessagesWithSoftFiltered = () => {
		if (!this.messagesStore.filterStore.isSoftFilter) return;
		const fetchedMessages = this.messages;
		const softFilteredMessages = this.softFilterResults;

		if (softFilteredMessages.length > 0 && fetchedMessages.length > 0) {
			const firstFetchedMessage = fetchedMessages[fetchedMessages.length - 1];
			const lastFetchedMessage = fetchedMessages[0];

			const firstSoftFilteredMessage = softFilteredMessages[softFilteredMessages.length - 1];
			const lastSoftFilteredMessage = softFilteredMessages[0];

			if (
				!this.softFilterChannelNext?.isLoading &&
				!this.softFilterChannelNext?.isEndReached &&
				timestampToNumber(lastFetchedMessage.timestamp) >
					timestampToNumber(lastSoftFilteredMessage.timestamp)
			) {
				this.softFilterChannelNext?.subscribe(lastSoftFilteredMessage.messageId);
			}

			if (
				!this.softFilterChannelPrev?.isLoading &&
				!this.softFilterChannelPrev?.isEndReached &&
				timestampToNumber(firstFetchedMessage.timestamp) <
					timestampToNumber(firstSoftFilteredMessage.timestamp)
			) {
				this.softFilterChannelPrev?.subscribe(firstSoftFilteredMessage.messageId);
			}
		}
	};

	@action
	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.resetMessagesDataState();
		this.loadMessages();
	};

	@action
	private resetMessagesDataState = (isError = false) => {
		this.initialItemCount = 0;
		this.startIndex = 10000;
		this.messages = [];
		this.isBeginReached = false;
		this.isEndReached = false;
		this.isError = isError;
		this.softFilterResults = [];
		this.noMatchingMessagesNext = false;
		this.noMatchingMessagesPrev = false;
		this.prevLoadEndTimestamp = null;
		this.nextLoadEndTimestamp = null;
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
	keepLoading = (direction: 'next' | 'previous') => {
		if (
			this.messagesStore.filterStore.filter.streams.length === 0 ||
			!this.searchChannelNext ||
			!this.searchChannelPrev ||
			(!this.prevLoadEndTimestamp && !this.nextLoadEndTimestamp)
		)
			return;

		const queryParams = this.messagesStore.filterStore.messsagesSSEConfig
			.queryParams as MessagesSSEParams;

		const { stream, endTimestamp, resultCountLimit, resumeFromId } = queryParams;

		const query: MessagesSSEParams = this.messagesStore.filterStore.isSoftFilter
			? {
					startTimestamp:
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						direction === 'previous' ? this.prevLoadEndTimestamp! : this.nextLoadEndTimestamp!,
					stream,
					searchDirection: direction,
					endTimestamp,
					resultCountLimit,
					resumeFromId,
			  }
			: {
					...queryParams,
					startTimestamp:
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						direction === 'previous' ? this.prevLoadEndTimestamp! : this.nextLoadEndTimestamp!,
					searchDirection: direction,
			  };

		if (direction === 'previous') {
			this.noMatchingMessagesPrev = false;
			this.startPreviousMessagesChannel({
				...query,
				resumeFromId: this.messages[this.messages.length - 1]?.messageId,
			});

			if (
				this.messagesStore.filterStore.isSoftFilter &&
				this.softFilterChannelPrev?.isLoading === false
			) {
				this.startPrevSoftFilterChannel({
					...queryParams,
					searchDirection: 'previous',
					resumeFromId: this.softFilterResults[this.softFilterResults.length - 1]?.messageId,
					startTimestamp: this.prevLoadEndTimestamp!,
				});
				this.softFilterChannelPrev?.subscribe();
			}
			this.searchChannelPrev.subscribe();
		} else {
			this.noMatchingMessagesNext = false;
			this.startNextMessagesChannel({
				...query,
				resumeFromId: this.messages[0]?.messageId,
			});

			if (
				this.messagesStore.filterStore.isSoftFilter &&
				this.softFilterChannelNext?.isLoading === false
			) {
				this.startNextSoftFilterChannel({
					...queryParams,
					searchDirection: 'next',
					resumeFromId: this.softFilterResults[0]?.messageId,
					startTimestamp: this.nextLoadEndTimestamp!,
				});
				this.softFilterChannelNext?.subscribe();
			}
			this.searchChannelNext.subscribe();
		}
	};
}
