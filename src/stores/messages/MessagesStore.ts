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
import moment from 'moment';
import { ListRange } from 'react-virtuoso';
import ApiSchema from '../../api/ApiSchema';
import { EventMessage } from '../../models/EventMessage';
import { timestampToNumber } from '../../helpers/date';
import MessagesFilter from '../../models/filter/MessagesFilter';
import { SelectedStore } from '../SelectedStore';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';
import MessagesDataProviderStore from './MessagesDataProviderStore';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { isEventMessage } from '../../helpers/event';
import { MessageFilterState } from '../../components/search-panel/SearchPanelFilters';
import { GraphStore } from '../GraphStore';
import MessagesFilterStore, { MessagesFilterStoreInitialState } from './MessagesFilterStore';
import FiltersHistoryStore from '../FiltersHistoryStore';
import { SessionsStore } from './SessionsStore';
import MessagesExportStore from './MessagesExportStore';
import { getItemAt } from '../../helpers/array';

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

export default class MessagesStore {
	private attachedMessagesSubscription: IReactionDisposer;

	public filterStore: MessagesFilterStore;

	public dataStore: MessagesDataProviderStore;

	public exportStore = new MessagesExportStore();

	@observable
	public hoveredMessage: EventMessage | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

	@observable
	public showFilterChangeHint = false;

	@observable
	public isFilteringTargetMessages = false;

	/*
		 This is used for filter change hint. Represents either last clicked message
		 or attached messages
	 */
	public hintMessages: EventMessage[] = [];

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private selectedStore: SelectedStore,
		private searchStore: SearchStore,
		private api: ApiSchema,
		private filterHistoryStore: FiltersHistoryStore,
		private sessionsStore: SessionsStore,
		defaultState: MessagesStoreDefaultStateType,
	) {
		this.filterStore = new MessagesFilterStore(this.searchStore);
		this.dataStore = new MessagesDataProviderStore(this, this.api);
		this.init(defaultState);

		this.attachedMessagesSubscription = reaction(
			() => this.workspaceStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(() => this.hoveredMessage, this.onMessageHover);

		reaction(() => this.filterStore.filter, this.exportStore.disableExport);
	}

	@computed
	public get messageSessions(): string[] {
		return this.searchStore.messageSessions;
	}

	@computed
	public get attachedMessages(): EventMessage[] {
		return this.workspaceStore.attachedMessages;
	}

	@computed
	public get isLoadingAttachedMessages() {
		return this.workspaceStore.isLoadingAttachedMessages;
	}

	@computed
	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;

		const messageTo = getItemAt(this.dataStore.sortedMessages, startIndex);
		const messageFrom = getItemAt(this.dataStore.sortedMessages, endIndex);

		if (messageFrom && messageTo) {
			return [timestampToNumber(messageFrom.timestamp), timestampToNumber(messageTo.timestamp)];
		}
		const timestampTo = this.filterStore.filter.timestampTo || moment().utc().valueOf();
		return [
			timestampTo - this.graphStore.eventInterval * 1000,
			timestampTo + this.graphStore.eventInterval * 1000,
		];
	}

	@action
	public setHoveredMessage(message: EventMessage | null) {
		this.hoveredMessage = message;
		this.graphStore.setHoveredTimestamp(message);
	}

	@action
	public applyFilter = (
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	) => {
		if (sseFilters) {
			this.filterHistoryStore.onMessageFilterSubmit(sseFilters);
		}
		if (
			this.selectedMessageId &&
			!this.workspaceStore.attachedMessagesIds.includes(this.selectedMessageId.valueOf())
		) {
			this.selectedMessageId = null;
		}

		this.exportStore.disableExport();
		this.sessionsStore.saveSessions(filter.streams.slice(0, this.filterStore.SESSIONS_LIMIT));
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
				this.selectedMessageId = new String(message.messageId);
				this.highlightedMessageId = new String(message.messageId);
				this.graphStore.setTimestamp(timestampToNumber(message.timestamp));
				this.workspaceStore.viewStore.activePanel = this;
			}
			this.filterStore.init(defaultState);
		}
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const shouldShowFilterHintBeforeRefetchingMessages = await this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const streams = this.filterStore.filter.streams;

			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = new String(message.messageId);
			this.graphStore.setTimestamp(timestampToNumber(message.timestamp));
			this.hintMessages = [];
			this.workspaceStore.viewStore.activePanel = this;

			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: timestampToNumber(message.timestamp),
				streams: [...new Set([...streams, message.sessionId])],
			});
		}

		if (this.workspaceStore.viewStore.panelsLayout[1] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public selectAttachedMessage = (message: EventMessage) => {
		const messageIndex = this.dataStore.sortedMessages.findIndex(
			m => m.messageId === message.messageId,
		);
		if (messageIndex !== -1) {
			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = new String(message.messageId);
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
				this.selectedMessageId = new String(mostRecentMessage.messageId);
				this.filterStore.setMessagesFilter(
					{
						...this.filterStore.filter,
						streams: [
							...new Set([...attachedMessages.map(({ sessionId }) => sessionId), ...streams]),
						],
						timestampTo: timestampToNumber(mostRecentMessage.timestamp),
					},
					this.filterStore.sseMessagesFilter,
					this.filterStore.isSoftFilter,
				);
			}
		}
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.hintMessages = [];

		this.filterStore.setMessagesFilter(
			{
				...this.filterStore.filter,
				timestampFrom: null,
				timestampTo: timestamp,
			},
			this.filterStore.sseMessagesFilter,
			this.filterStore.isSoftFilter,
		);

		if (this.workspaceStore.viewStore.panelsLayout[1] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
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
			this.hintMessages.map(hm => this.api.messages.matchMessage(hm.messageId, matchMessageParams)),
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

		this.selectedMessageId = new String(targetMessage.messageId);
		this.highlightedMessageId = new String(targetMessage.messageId);
		this.showFilterChangeHint = false;
		this.graphStore.setTimestamp(timestampToNumber(targetMessage.timestamp));

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

	private onMessageHover = (hoveredMessage: EventMessage | null) => {
		if (hoveredMessage !== null) {
			this.graphStore.setTimestamp(timestampToNumber(hoveredMessage.timestamp));
		}
	};
}
