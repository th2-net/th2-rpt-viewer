/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
	action, computed, observable, toJS, reaction, IReactionDisposer,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';
import { prevCyclicItem, nextCyclicItem } from '../helpers/array';
import WindowsStore from './WindowsStore';
import { getTimestampAsNumber } from '../helpers/date';

export const enum MessagesLoadingState {
	LOADING_PREVIOUS_ITEMS,
	LOADING_NEXT_ITEMS,
	LOADING_ROOT_ITEMS,
	LOADING_SELECTED_MESSAGE,
}

export default class MessagesStore {
	filterStore = new FilterStore();

	disposer: IReactionDisposer | null = null;

	private readonly MESSAGES_CHUNK_SIZE = 50;

	@observable messagesLoadingState: MessagesLoadingState | null = null;

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesCache: Map<string, EventMessage> = new Map();

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

	constructor(private api: ApiSchema, private windowsStore: WindowsStore, messagesStore?: MessagesStore) {
		if (messagesStore) {
			this.copy(messagesStore);
		}

		// We have to dispose reaction after deleting tab otherwise store will not be garbage collected
		this.disposer = reaction(
			() => this.windowsStore.attachedMessagesIds,
			this.onAttachedMessagesChange,
		);

		reaction(
			() => this.filterStore.messagesFilter,
			this.onFilterChange,
		);

		reaction(
			() => this.selectedMessageId,
			selectedMessageId => {
				if (selectedMessageId) this.scrollToMessage(selectedMessageId.valueOf());
			},
		);
	}

	@action
	toggleMessageDetailedRaw = (messageId: string) => {
		if (this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
		} else {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	@action
	toggleMessageBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
		} else {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	@action
	fetchMessage = async (id: string) => {
		let message = this.messagesCache.get(id);

		if (!message) {
			message = await this.api.messages.getMessage(id);
			this.messagesCache.set(id, message);
		}

		return message;
	};

	@computed get selectedMessagesIds(): string[] {
		const pinnedMessages = this.windowsStore.pinnedMessages
			.filter(msg => this.messagesIds.includes(msg.messageId));
		const messages = [...this.attachedMessages, ...pinnedMessages]
			.filter((message, index, self) => self.findIndex(m => m.messageId === message.messageId) === index);
		messages.sort((mesA, mesB) => getTimestampAsNumber(mesA.timestamp) - getTimestampAsNumber(mesB.timestamp));

		if (this.filterStore.isMessagesFilterApplied) {
			return messages.filter(m => this.messagesIds.includes(m.messageId)).map(m => m.messageId);
		}

		return messages.map(m => m.messageId);
	}

	@action
	selectNextMessage = () => {
		if (!this.selectedMessageId || !this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())) {
			this.selectedMessageId = this.selectedMessagesIds[0];
			return;
		}
		const nextMessageId = nextCyclicItem(this.selectedMessagesIds, this.selectedMessageId);

		if (nextMessageId) this.selectedMessageId = nextMessageId;
	};

	@action
	selectPrevMessage = () => {
		if (!this.selectedMessageId || !this.selectedMessagesIds.includes(this.selectedMessageId.valueOf())) {
			this.selectedMessageId = this.selectedMessagesIds[this.selectedMessagesIds.length - 1];
			return;
		}
		const prevMessageId = prevCyclicItem(this.selectedMessagesIds, this.selectedMessageId);

		if (prevMessageId) this.selectedMessageId = prevMessageId;
	};

	@action
	toggleBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
			return;
		}
		this.beautifiedMessages = [...this.beautifiedMessages, messageId];
	};

	messagesAbortController: AbortController | null = null;

	@action
	getMessages = async (
		timelineDirection: 'next' | 'previous' = 'next',
		originMessageId?: string,
	): Promise<string[] | undefined> => {
		if (this.messagesAbortController) {
			this.messagesAbortController.abort();
		}

		if (!this.filterStore.messagesFilter.streams.length) {
			this.messagesIds = [];
			this.messagesCache.clear();
			this.isLoading = false;
			return;
		}

		this.isLoading = true;

		try {
			this.messagesAbortController = new AbortController();

			const messagesIds = await this.api.messages.getMessages({
				messageId: originMessageId,
				timelineDirection,
				limit: this.MESSAGES_CHUNK_SIZE,
			}, this.filterStore.messagesFilter, this.messagesAbortController.signal);

			if (originMessageId && !this.messagesIds.includes(originMessageId)) {
				this.messagesIds = [];
				this.messagesCache.clear();
			}

			const newMessagesIds = timelineDirection === 'previous'
				? messagesIds.reverse() : messagesIds;

			if (newMessagesIds.length) {
				// TODO: It's a temporary measure to create a timeline until timeline helper api is released.
				await this.fetchMessage(messagesIds[0]);
			}

			if (timelineDirection === 'previous') {
				this.messagesIds = [
					...newMessagesIds,
					...this.messagesIds,
				];
			} else {
				if (newMessagesIds[0] === this.messagesIds[this.messagesIds.length - 1]) {
					newMessagesIds.shift();
				}
				this.messagesIds = [
					...this.messagesIds,
					...newMessagesIds,
				];
			}

			// eslint-disable-next-line consistent-return
			return messagesIds;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading messages', error);
			}
		} finally {
			this.isLoading = false;
			this.messagesLoadingState = null;
		}
	};

	loadPreviousMessages = () => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_PREVIOUS_ITEMS;
		return this.getMessages('previous', this.messagesIds[0]);
	};

	loadNextMessages = () => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_NEXT_ITEMS;
		const originMessageId = !this.messagesIds.length
			? this.attachedMessages[0].messageId
			: this.messagesIds[this.messagesIds.length - 1];
		return this.getMessages('next', originMessageId);
	};

	resetMessagesFilter = () => {
		const streams = this.attachedMessages.map(m => m.sessionId)
			.filter((stream, index, self) => self.indexOf(stream) === index);
		this.filterStore.resetMessagesFilter(streams);
	};

	@action
	scrollToMessage = (messageId: string) => {
		const messageIndex = this.messagesIds.indexOf(messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
			return;
		}
		this.messagesLoadingState = MessagesLoadingState.LOADING_SELECTED_MESSAGE;
		this.getMessages('next', messageId)
			.then(() => this.scrolledIndex = this.messagesIds.indexOf(messageId));
	};

	attachedMessagesAbortController: AbortController | null = null;

	@action
	private onAttachedMessagesChange = async (attachedMessagesIds: string[]) => {
		if (!attachedMessagesIds.length) {
			this.attachedMessages = [];
			return;
		}

		if (this.attachedMessagesAbortController) {
			this.attachedMessagesAbortController.abort();
		}

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
			const messages = [...newlySelectedMessages, ...previouslySelectedMessages];

			messages.sort((mesA, mesB) => getTimestampAsNumber(mesA.timestamp) - getTimestampAsNumber(mesB.timestamp));

			this.attachedMessages = messages;
			this.filterStore.messagesFilter.streams = messages.map(m => m.sessionId)
				.filter((stream, index, self) => self.indexOf(stream) === index);

			if (newlySelectedMessages.length) {
				newlySelectedMessages
					.sort((mesA, mesB) => getTimestampAsNumber(mesA.timestamp) - getTimestampAsNumber(mesB.timestamp));
				this.selectedMessageId = newlySelectedMessages[0].messageId;
			}
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading attached messages', error);
			}
		}
	};

	@action
	private onFilterChange = () => {
		this.messagesLoadingState = MessagesLoadingState.LOADING_ROOT_ITEMS;
		this.messagesIds = [];
		this.messagesCache.clear();
		const originMessageId = this.attachedMessages.length
			? this.attachedMessages[0].messageId
			: undefined;
		this.getMessages('next', originMessageId);
	};

	@action
	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds);
		this.messagesCache = observable(store.messagesCache);
		this.beautifiedMessages = observable(store.beautifiedMessages);
		this.detailedRawMessagesIds = observable(store.detailedRawMessagesIds);
		this.isLoading = store.isLoading.valueOf();
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId?.valueOf() || null;
		this.messagesLoadingState = store.messagesLoadingState;
		this.attachedMessages = store.attachedMessages;
		this.filterStore = new FilterStore(store.filterStore);
	}
}
