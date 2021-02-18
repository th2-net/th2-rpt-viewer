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

import { action, reaction, observable, computed } from 'mobx';
import ApiSchema from '../../api/ApiSchema';
import { MessagesSSEParams } from '../../api/sse';
import { EventMessage } from '../../models/EventMessage';
import MessagesFilter from '../../models/filter/MessagesFilter';
import MessagesStore from './MessagesStore';
import { SSEChannel } from './SSEChannel';

export default class MessagesDataProviderStore {
	constructor(private messagesStore: MessagesStore, private api: ApiSchema) {
		reaction(() => this.messagesStore.filterStore.messagesFilter, this.onFilterChange);
	}

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

	@observable
	public messagesListErrorStatusCode: number | null = null;

	@observable.ref
	public messages: Array<EventMessage> = [];

	@observable
	public isError = false;

	@observable
	searchChannelPrev: SSEChannel | null = null;

	@observable
	searchChannelNext: SSEChannel | null = null;

	@computed
	public get isLoadingNextMessages() {
		return Boolean(this.searchChannelNext?.isLoading);
	}

	@computed
	public get isLoadingPreviousMessages() {
		return Boolean(this.searchChannelPrev?.isLoading);
	}

	@computed
	public get isLoading() {
		return this.isLoadingNextMessages || this.isLoadingPreviousMessages;
	}

	@action
	loadMessages = async () => {
		this.stopMessagesLoading();

		const prevQuery = {
			...this.messagesStore.filterStore.sseConfig.queryParams,
		} as MessagesSSEParams;

		const nextQuery = {
			...prevQuery,
			searchDirection: 'next',
		} as MessagesSSEParams;

		this.startPreviousMessagesChannel(prevQuery);
		this.startNextMessagesChannel(nextQuery);

		if (this.searchChannelPrev && this.searchChannelNext) {
			const [nextMessages, prevMessages] = await Promise.all([
				this.searchChannelNext.load(),
				this.searchChannelPrev.load(),
			]);

			const firstNextMessage = nextMessages[nextMessages.length - 1];

			if (firstNextMessage && firstNextMessage.messageId === prevMessages[0]?.messageId) {
				nextMessages.pop();
			}

			this.messages = [...nextMessages, ...prevMessages];

			if (this.messagesStore.selectedMessageId) {
				this.messagesStore.scrollToMessage(this.messagesStore.selectedMessageId?.valueOf());
			}
		}
	};

	@action
	stopMessagesLoading = () => {
		this.searchChannelPrev?.stop();
		this.searchChannelNext?.stop();
		this.searchChannelPrev = null;
		this.searchChannelNext = null;
		this.resetMessagesDataState();
	};

	@action
	startPreviousMessagesChannel = (query: MessagesSSEParams) => {
		this.searchChannelPrev = new SSEChannel(
			this.messagesStore,
			this.messagesStore.filterStore.sseConfig.type,
			query,
			this.onPrevChannelResponse,
			this.onPrevChannelClose,
			this.onPrevChannelError,
		);
	};

	onPrevChannelResponse = (messages: EventMessage[]) => {
		this.messages = [...this.messages, ...messages];
	};

	onPrevChannelClose = () => {
		// this.searchChannelPrev?.stop();
		// this.searchChannelPrev = null;
	};

	onPrevChannelError = () => {
		this.searchChannelPrev?.stop();
		this.searchChannelPrev = null;
		this.isError = true;
	};

	@action
	startNextMessagesChannel = (query: MessagesSSEParams) => {
		this.searchChannelNext = new SSEChannel(
			this.messagesStore,
			this.messagesStore.filterStore.sseConfig.type,
			query,
			this.onNextChannelResponse,
			this.onNextChannelClose,
			this.onNextChannelError,
		);
	};

	onNextChannelResponse = (messages: EventMessage[]) => {
		const messagesToAppend = messages.filter(
			m => this.messages.findIndex(topMsg => topMsg.messageId === m.messageId) === -1,
		);
		this.messages = [...messagesToAppend, ...this.messages];
	};

	onNextChannelClose = () => {
		// this.searchChannelNext?.stop();
		// this.searchChannelNext = null;
	};

	onNextChannelError = () => {
		this.searchChannelNext?.stop();
		this.searchChannelNext = null;
		this.isError = true;
	};

	@action
	public getPreviousMessages = async (): Promise<EventMessage[]> => {
		if (!this.searchChannelPrev || this.searchChannelPrev.isLoading) {
			return [];
		}

		return this.searchChannelPrev.load();
	};

	@action
	public getNextMessages = async (): Promise<EventMessage[]> => {
		if (!this.searchChannelNext || this.searchChannelNext.isLoading) {
			return [];
		}

		return this.searchChannelNext.load();
	};

	@action
	private onFilterChange = async (filter: MessagesFilter) => {
		this.stopMessagesLoading();

		if (filter.streams.length === 0) {
			this.resetMessagesDataState();
		}
		this.loadMessages();
	};

	@action
	private resetMessagesDataState = () => {
		this.messages = [];
		this.isBeginReached = false;
		this.isEndReached = false;
		this.isError = false;
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
}
