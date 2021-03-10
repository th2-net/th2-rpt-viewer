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
import { EventMessage } from '../../models/EventMessage';
import MessagesStore from './MessagesStore';
import { SSEChannel } from './SSEChannel';

export default class MessagesDataProviderStore {
	constructor(private messagesStore: MessagesStore, private api: ApiSchema) {
		reaction(() => this.messagesStore.filterStore.filter, this.onFilterChange);
	}

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

	@observable
	public messagesListErrorStatusCode: number | null = null;

	@observable.shallow
	public messages: Array<EventMessage> = [];

	@observable
	public isError = false;

	@observable
	searchChannelPrev: SSEChannel | null = null;

	@observable
	searchChannelNext: SSEChannel | null = null;

	@observable
	startIndex = 10000;

	@observable
	initialItemCount = 0;

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

		if (this.messagesStore.filterStore.filter.streams.length === 0) return;

		const prevQuery = {
			...this.messagesStore.filterStore.messsagesSSEConfig.queryParams,
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

			runInAction(() => {
				this.messages = [...nextMessages, ...prevMessages];
				this.initialItemCount = this.messages.length;
			});

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
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onPrevChannelResponse,
			this.onPrevChannelError,
		);
	};

	@action
	onPrevChannelResponse = (messages: EventMessage[]) => {
		if (messages.length !== 0) {
			const firstNextMessage = messages[0];

			if (
				firstNextMessage &&
				firstNextMessage.messageId === this.messages[this.messages.length - 1]?.messageId
			) {
				messages.shift();
			}
			this.messages = [...this.messages, ...messages];

			const selectedMessageId = this.messagesStore.selectedMessageId?.valueOf();
			if (selectedMessageId && messages.find(m => m.messageId === selectedMessageId)) {
				this.messagesStore.scrollToMessage(selectedMessageId);
			}
		}
	};

	@action
	onPrevChannelError = () => {
		this.searchChannelPrev?.stop();
		this.searchChannelPrev = null;
		this.isError = true;
	};

	@action
	startNextMessagesChannel = (query: MessagesSSEParams) => {
		this.searchChannelNext = new SSEChannel(
			this.messagesStore.filterStore.messsagesSSEConfig.type,
			query,
			this.onNextChannelResponse,
			this.onNextChannelError,
		);
	};

	@action
	onNextChannelResponse = (messages: EventMessage[]) => {
		if (messages.length !== 0) {
			const firstNextMessage = messages[this.messages.length - 1];

			if (firstNextMessage && firstNextMessage.messageId === this.messages[0]?.messageId) {
				messages.pop();
			}
			this.startIndex -= messages.length;
			this.messages = [...messages, ...this.messages];
		}
	};

	@action
	onNextChannelError = () => {
		this.searchChannelNext?.stop();
		this.searchChannelNext = null;
		this.isError = true;
	};

	@action
	public getPreviousMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelPrev || this.searchChannelPrev.isLoading) {
			return [];
		}

		return this.searchChannelPrev.load(resumeFromId);
	};

	@action
	public getNextMessages = async (resumeFromId?: string): Promise<EventMessage[]> => {
		if (!this.searchChannelNext || this.searchChannelNext.isLoading) {
			return [];
		}

		return this.searchChannelNext.load(resumeFromId);
	};

	@action
	private onFilterChange = async () => {
		this.stopMessagesLoading();
		this.resetMessagesDataState();
		this.loadMessages();
	};

	@action
	private resetMessagesDataState = () => {
		this.initialItemCount = 0;
		this.startIndex = 10000;
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
