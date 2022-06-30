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

import { action, computed, observable, reaction, IReactionDisposer, runInAction } from 'mobx';
import { MessageFilterState } from 'modules/search/models/Search';
import { IFilterConfigStore } from 'models/Stores';
import { FilterEntry } from 'modules/search/stores/SearchStore';
import ApiSchema from '../../api/ApiSchema';
import { EventMessage, EventMessageItem } from '../../models/EventMessage';
import MessagesFilter from '../../models/filter/MessagesFilter';
import WorkspaceStore from '../workspace/WorkspaceStore';
import MessagesDataProviderStore from './MessagesDataProviderStore';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { isEventMessage } from '../../helpers/event';
import MessagesFilterStore, { MessagesFilterStoreInitialState } from './MessagesFilterStore';
import { SessionHistoryStore } from './SessionHistoryStore';
import MessagesExportStore from './MessagesExportStore';
import { getItemAt } from '../../helpers/array';
import { timestampToNumber } from '../../helpers/date';

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
	targetMessageBodyRange?: FilterEntry;
	targetMessageBodyBinaryRange?: FilterEntry;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

export default class MessagesStore {
	private attachedMessagesSubscription: IReactionDisposer;

	public filterStore: MessagesFilterStore;

	public dataStore: MessagesDataProviderStore;

	public exportStore = new MessagesExportStore();

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public showFilterChangeHint = false;

	@observable selectedBodyFilter: FilterEntry | null = null;

	@observable selectedBodyBinaryFilter: FilterEntry | null = null;

	@observable
	public isFilteringTargetMessages = false;

	/*
		 This is used for filter change hint. Represents either last clicked message
		 or attached messages
	 */
	public hintMessages: EventMessage[] = [];

	constructor(
		private workspaceStore: WorkspaceStore,
		private filterConfigStore: IFilterConfigStore,
		private api: ApiSchema,
		private sessionsStore: SessionHistoryStore,
		defaultState: MessagesStoreDefaultStateType,
	) {
		this.filterStore = new MessagesFilterStore(
			this.filterConfigStore,
			defaultState && typeof defaultState === 'object' ? defaultState : undefined,
		);
		this.dataStore = new MessagesDataProviderStore(this, this.api);
		this.init(defaultState);

		this.attachedMessagesSubscription = reaction(
			() => this.workspaceStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(() => this.filterStore.filter, this.exportStore.disableExport);
	}

	@observable
	public messagesInView: EventMessage[] = [];

	@action
	public setRenderedItems = (renderedMessages: EventMessageItem[]) => {
		this.messagesInView = renderedMessages;
	};

	@computed
	public get messageSessions(): string[] {
		return this.filterConfigStore.messageSessions;
	}

	@computed
	public get attachedMessages(): EventMessage[] {
		return this.workspaceStore.attachedMessages;
	}

	@computed
	public get isLoadingAttachedMessages() {
		return this.workspaceStore.isLoadingAttachedMessages;
	}

	@action
	public applyFilter = (
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	) => {
		if (
			this.selectedMessageId &&
			!this.workspaceStore.attachedMessagesIds.includes(this.selectedMessageId.valueOf())
		) {
			this.selectedMessageId = null;
		}

		this.exportStore.disableExport();
		this.sessionsStore.saveSessions(filter.streams);
		this.hintMessages = [];
		this.showFilterChangeHint = false;
		this.highlightedMessageId = null;
		this.filterStore.setMessagesFilter(filter, sseFilters, isSoftFilterApplied);
	};

	private init = async (defaultState: MessagesStoreDefaultStateType) => {
		if (!defaultState) {
			return;
		}
		if (typeof defaultState === 'string') {
			try {
				const message = await this.api.messages.getMessage(defaultState);
				this.onMessageSelect(message);
			} catch (error) {
				console.error(`Couldnt fetch target message ${defaultState}`);
			}
		} else {
			const message = defaultState.targetMessage;
			if (isEventMessage(message)) {
				this.selectedMessageId = new String(message.id);
				this.highlightedMessageId = new String(message.id);
				this.workspaceStore.viewStore.activePanel = this;
				if (defaultState.targetMessageBodyRange) {
					this.selectedBodyFilter = defaultState.targetMessageBodyRange;
				}
				if (defaultState.targetMessageBodyBinaryRange) {
					this.selectedBodyBinaryFilter = defaultState.targetMessageBodyBinaryRange;
				}
			}
		}
		this.dataStore.loadMessages();
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const shouldShowFilterHintBeforeRefetchingMessages = await this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const streams = this.filterStore.filter.streams;

			this.selectedMessageId = new String(message.id);
			this.highlightedMessageId = new String(message.id);
			this.hintMessages = [];
			this.workspaceStore.viewStore.activePanel = this;

			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: timestampToNumber(message.timestamp),
				streams: [...new Set([...streams, message.sessionId])],
			});
		}
	};

	@action
	public selectAttachedMessage = (message: EventMessage) => {
		const messageIndex = this.dataStore.messages.findIndex(m => m.id === message.id);
		if (messageIndex !== -1) {
			this.selectedMessageId = new String(message.id);
			this.highlightedMessageId = new String(message.id);
		} else {
			this.onMessageSelect(message);
		}
	};

	@action
	public onAttachedMessagesChange = async (attachedMessages: EventMessage[]) => {
		const shouldShowFilterHintBeforeRefetchingMessages = await this.handleFilterHint(
			attachedMessages,
		);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const mostRecentMessage = getItemAt(sortMessagesByTimestamp(attachedMessages), 0);
			if (mostRecentMessage) {
				const streams = this.filterStore.filter.streams;
				this.selectedMessageId = new String(mostRecentMessage.id);
				this.filterStore.filter = {
					...this.filterStore.filter,
					streams: [
						...new Set([...streams, ...attachedMessages.map(({ sessionId }) => sessionId)]),
					],
					timestampTo: timestampToNumber(mostRecentMessage.timestamp),
				};
			}
		}
	};

	@action
	public clearFilters = () => {
		this.hintMessages = [];
		this.filterStore.resetMessagesFilter({ streams: this.filterStore.filter.streams });
		this.dataStore.stopMessagesLoading();
		this.dataStore.resetState();
	};

	@action
	/*
		This method handles message select or attached messages change events.
		When those events occur we want to check if selected message or
		attached messages match current filter and streams. If it doesn't match
		filter change hint window is shown to a user. And it is up to user to decide
		if he wants to reset streams to message(s) streams and update filters
	 */
	private handleFilterHint = async (message: EventMessage | EventMessage[]): Promise<boolean> => {
		this.hintMessages = Array.isArray(message) ? message : [message];
		const matchMessageParams = this.filterStore.filterParams;

		if (
			this.hintMessages.length === 0 ||
			(!matchMessageParams.filters?.length && !matchMessageParams.stream.length)
		) {
			this.showFilterChangeHint = false;
			return this.showFilterChangeHint;
		}

		runInAction(() => (this.isFilteringTargetMessages = true));

		const hintMessagesMatch = await Promise.all(
			this.hintMessages.map(hm => this.api.messages.matchMessage(hm.id, matchMessageParams)),
		).finally(() => {
			runInAction(() => (this.isFilteringTargetMessages = false));
		});

		this.showFilterChangeHint = hintMessagesMatch.some(isMatched => !isMatched);

		return this.showFilterChangeHint;
	};

	@action
	public applyFilterHint = () => {
		if (!this.hintMessages.length) return;

		this.dataStore.searchChannelNext?.stop();
		this.dataStore.searchChannelPrev?.stop();

		const targetMessage: EventMessage = sortMessagesByTimestamp(this.hintMessages)[0];

		this.selectedMessageId = new String(targetMessage.id);
		this.highlightedMessageId = new String(targetMessage.id);
		this.showFilterChangeHint = false;

		this.filterStore.resetMessagesFilter({
			streams: [...new Set(this.hintMessages.map(({ sessionId }) => sessionId))],
			timestampTo: timestampToNumber(targetMessage.timestamp),
			timestampFrom: null,
		});

		this.hintMessages = [];
	};

	// Unsubcribe from reactions
	public dispose = () => {
		this.attachedMessagesSubscription();
		this.filterStore.dispose();
		this.dataStore.stopMessagesLoading();
		this.dataStore.resetState();
	};
}
