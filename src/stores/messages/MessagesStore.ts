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
import moment from 'moment';
import { ListRange } from 'react-virtuoso/dist/engines/scrollSeekEngine';
import ApiSchema from '../../api/ApiSchema';
import FilterStore from '../FilterStore';
import { EventMessage } from '../../models/EventMessage';
import { prevCyclicItem, nextCyclicItem } from '../../helpers/array';
import { getTimestampAsNumber } from '../../helpers/date';
import { TabTypes } from '../../models/util/Windows';
import MessagesFilter from '../../models/filter/MessagesFilter';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { SelectedStore } from '../SelectedStore';
import MessageUpdateStore from './MessageUpdateStore';
import { isEventMessage } from '../../helpers/event';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { isMessagesStore } from '../../helpers/stores';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';

export const defaultMessagesLoadingState = {
	loadingPreviousItems: false,
	loadingNextItems: false,
	loadingRootItems: false,
	loadingSelectedMessage: false,
};

export type MessagesStoreURLState = Partial<{
	type: TabTypes.Messages;
	filter: Partial<MessagesFilter>;
}>;

export type MessagesStoreDefaultStateType = MessagesStore | MessagesStoreURLState | null;

export default class MessagesStore {
	public readonly MESSAGES_CHUNK_SIZE = 25;

	private attachedMessagesSubscription: IReactionDisposer;

	filterStore = new FilterStore(this.searchStore);

	messageUpdateStore = new MessageUpdateStore(this.api, this, this.filterStore);

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesLoadingState = defaultMessagesLoadingState;

	@observable
	public messagesCache: Map<string, EventMessage> = observable.map(new Map(), { deep: false });

	@observable
	public messageSessions: Array<string> = [];

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public scrollTopMessageId: string | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: Array<string> = [];

	@observable
	public isEndReached = false;

	@observable
	public isBeginReached = false;

	@observable
	public messagesListErrorStatusCode: number | null = null;

	@observable
	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

	constructor(
		private workspaceStore: WorkspaceStore,
		private selectedStore: SelectedStore,
		private searchStore: SearchStore,
		private api: ApiSchema,
		defaultState: MessagesStoreDefaultStateType | EventMessage,
	) {
		if (isMessagesStore(defaultState)) {
			this.copy(defaultState);
		} else if (isEventMessage(defaultState)) {
			this.onSavedItemSelect(defaultState);
		} else if (defaultState !== null) {
			this.filterStore.messagesFilter = {
				...this.filterStore.messagesFilter,
				timestampFrom: defaultState.filter?.timestampFrom || null,
				timestampTo: defaultState.filter?.timestampTo || moment().utc().valueOf(),
			};
		}

		this.attachedMessagesSubscription = reaction(
			() => this.workspaceStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(() => this.filterStore.messagesFilter, this.onFilterChange);

		reaction(() => this.filterStore.messagesFilter.streams, this.onStreamsChanged);

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);

		if (this.messageSessions.length === 0) {
			this.loadMessageSessions();
		}
	}

	@computed
	public get selectedMessagesIds(): string[] {
		const pinnedMessages = this.selectedStore.pinnedMessages.filter(msg =>
			this.messagesIds.includes(msg.messageId),
		);

		const messages = [...this.workspaceStore.attachedMessages, ...pinnedMessages].filter(
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

	@computed
	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;
		const messagesIds = this.messagesIds.slice(startIndex, endIndex);

		const fromMsgId = messagesIds
			.slice()
			.reverse()
			.find(messageId => this.messagesCache.get(messageId));
		const toMsgId = messagesIds.find(messageId => this.messagesCache.get(messageId));

		const messageFrom = fromMsgId && this.messagesCache.get(fromMsgId);
		const messageTo = toMsgId && this.messagesCache.get(toMsgId);

		if (messageFrom && messageTo) {
			return [
				getTimestampAsNumber(messageFrom.timestamp),
				getTimestampAsNumber(messageTo.timestamp),
			];
		}
		const timestampTo = this.filterStore.messagesFilter.timestampTo || moment().utc().valueOf();
		return [timestampTo - 30 * 1000, timestampTo];
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

	@computed
	get isActivePanel() {
		return this.workspaceStore.isActive && this.workspaceStore.viewStore.activePanel === this;
	}

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

	@action
	public getMessages = async (
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
		this.messagesListErrorStatusCode = null;

		const appliedFilter: MessagesFilter =
			originMessageId || this.messagesIds.length > 0
				? {
						...this.filterStore.messagesFilter,
						timestampFrom: null,
						timestampTo: null,
				  }
				: this.filterStore.messagesFilter;

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
					appliedFilter,
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
					appliedFilter,
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
				this.messagesListErrorStatusCode = error.status;
				this.messagesIds = [];
				this.messagesCache.clear();
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

	public abortControllers: { [key: string]: AbortController | null } = {
		prevAC: null,
		nextAC: null,
	};

	@action
	public loadPreviousMessages = async (loadBody = true, messageId?: string | null) => {
		if (this.isEndReached) return [];
		this.abortControllers.prevAC?.abort();
		this.abortControllers.prevAC = new AbortController();

		this.messagesLoadingState.loadingPreviousItems = true;
		let originMessageId: string | null | undefined = messageId;

		if (messageId !== null) {
			originMessageId =
				messageId ||
				(!this.messagesIds.length
					? this.workspaceStore.attachedMessages[0]?.messageId
					: this.messagesIds[this.messagesIds.length - 1]);
		}

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
				this.messagesIds[0] || this.workspaceStore.attachedMessages[0].messageId,
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

	@action
	private resetMessagesState = () => {
		this.messagesIds = [];
		this.messagesCache.clear();
		this.scrolledIndex = null;
		this.isBeginReached = false;
		this.isEndReached = false;
		this.messagesLoadingState = defaultMessagesLoadingState;
	};

	public resetMessagesFilter = () => {
		const streams = this.workspaceStore.attachedMessages
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

	@action
	private onAttachedMessagesChange = (attachedMessages: EventMessage[]) => {
		if (this.messagesIds.length !== 0) return;

		this.isBeginReached = false;
		this.isEndReached = false;

		this.filterStore.messagesFilter.streams = [...new Set(attachedMessages.map(m => m.sessionId))];

		const targetMessageId = sortMessagesByTimestamp(attachedMessages)[0]?.messageId;

		if (targetMessageId) {
			this.selectedMessageId = new String(targetMessageId);
		}
	};

	@action
	public applyStreams = () => {
		this.filterStore.messagesFilter = {
			...this.filterStore.messagesFilter,
			streams: [
				...new Set([
					...this.filterStore.messagesFilter.streams,
					...this.workspaceStore.attachedMessagesStreams,
				]),
			],
		};
	};

	@action
	private onStreamsChanged = (streams: string[]) => {
		if ((this.isActivePanel || this.messagesIds.length === 0) && streams.length === 0) {
			this.resetMessagesState();
		}
	};

	@action
	private onFilterChange = async () => {
		this.resetMessagesState();
		this.messagesLoadingState.loadingRootItems = true;
		try {
			await this.loadPreviousMessages(false, null);
		} finally {
			this.messagesLoadingState.loadingRootItems = false;
		}
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (this.messageUpdateStore.isSubscriptionActive) {
			this.messageUpdateStore.disableSubscription();
		}
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	@action
	public onSavedItemSelect = async (savedMessage: EventMessage) => {
		if (!this.messagesIds.includes(savedMessage.messageId)) {
			this.filterStore.messagesFilter.timestampFrom = null;
			this.filterStore.messagesFilter.timestampTo = getTimestampAsNumber(savedMessage.timestamp);
			this.filterStore.messagesFilter.messageTypes = [];
			this.filterStore.messagesFilter.streams = [savedMessage.sessionId];
		}

		this.scrollToMessage(savedMessage.messageId);
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.filterStore.messagesFilter = {
			...this.filterStore.messagesFilter,
			timestampFrom: null,
			timestampTo: timestamp,
		};
	};

	@action
	public setScrollTopMessageId = (index: number) => {
		this.scrollTopMessageId = this.messagesIds[index];
	};

	@action
	public addMessagesToList = (
		messages: EventMessage[] | string[],
		timelineDirection: 'next' | 'previous',
	) => {
		if (!messages.length) return;
		let messagesIds = messages;
		if (isEventMessage(messages[0])) {
			messagesIds = (messages as EventMessage[]).map(message => message.messageId);
			(messages as EventMessage[]).forEach(message => {
				this.messagesCache.set(message.messageId, message);
			});
		}

		if (timelineDirection === 'next') {
			this.messagesIds = [...(messagesIds.reverse() as string[]), ...this.messagesIds];
		} else {
			this.messagesIds = [...this.messagesIds, ...(messagesIds as string[])];
		}
	};

	@action
	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds.slice());
		this.messagesCache = observable.map(toJS(store.messagesCache), { deep: false });
		this.beautifiedMessages = toJS(store.beautifiedMessages.slice());
		this.detailedRawMessagesIds = toJS(store.detailedRawMessagesIds.slice());
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId
			? new String(store.selectedMessageId.valueOf())
			: null;
		this.messagesLoadingState = toJS(store.messagesLoadingState);
		this.filterStore = new FilterStore(this.searchStore, {
			messagesFilter: toJS(store.filterStore.messagesFilter),
		});
		this.isEndReached = store.isEndReached.valueOf();
		this.isBeginReached = store.isBeginReached.valueOf();

		if (!store.messageSessions.length) {
			this.loadMessageSessions();
		} else {
			this.messageSessions = store.messageSessions.slice();
		}
	}

	public dispose = () => {
		this.attachedMessagesSubscription();
		this.filterStore.dispose();
	};
}
