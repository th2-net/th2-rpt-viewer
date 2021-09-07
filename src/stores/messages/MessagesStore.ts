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

import { action, computed, observable, reaction, IReactionDisposer } from 'mobx';
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

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

export default class MessagesStore {
	private attachedMessagesSubscription: IReactionDisposer;

	public filterStore = new MessagesFilterStore(this.searchStore);

	public dataStore = new MessagesDataProviderStore(this, this.api);

	@observable
	public hoveredMessage: EventMessage | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: Array<string> = [];

	@observable
	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

	@observable
	public showFilterChangeHint = false;

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
		this.init(defaultState);

		this.attachedMessagesSubscription = reaction(
			() => this.workspaceStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);

		reaction(() => this.hoveredMessage, this.onMessageHover);
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
	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;

		const messageTo = this.dataStore.messages[startIndex];
		const messageFrom = this.dataStore.messages[endIndex];

		if (messageFrom && messageTo) {
			return [timestampToNumber(messageFrom.timestamp), timestampToNumber(messageTo.timestamp)];
		}
		const timestampTo = this.filterStore.filter.timestampTo || moment().utc().valueOf();
		return [timestampTo - 15 * 1000, timestampTo + 15 * 1000];
	}

	@action
	public setHoveredMessage(message: EventMessage | null) {
		this.hoveredMessage = message;
		this.graphStore.setHoveredTimestamp(message);
	}

	@action
	public showDetailedRawMessage = (messageId: string) => {
		if (!this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	@action
	public hideDetailedRawMessage = (messageId: string) => {
		this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
	};

	@action
	public beautify = (messageId: string) => {
		if (!this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	@action
	public debeautify = (messageId: string) => {
		this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
	};

	@action
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.dataStore.messages.findIndex(m => m.messageId === messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	@action
	public applyFilter = (
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	) => {
		if (sseFilters) {
			this.filterHistoryStore.onMessageFilterSubmit(sseFilters);
		}

		this.sessionsStore.saveSessions(filter.streams);
		this.hintMessages = [];
		this.showFilterChangeHint = false;
		this.selectedMessageId = null;
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
			this.filterStore = new MessagesFilterStore(this.searchStore, defaultState);
			const message = defaultState.targetMessage;
			if (isEventMessage(message)) {
				this.selectedMessageId = new String(message.messageId);
				this.highlightedMessageId = message.messageId;
				this.graphStore.setTimestamp(timestampToNumber(message.timestamp));
				this.workspaceStore.viewStore.activePanel = this;
			}
		}
		this.dataStore.loadMessages();
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const shouldShowFilterHintBeforeRefetchingMessages = this.handleFilterHint(message);

		if (!shouldShowFilterHintBeforeRefetchingMessages) {
			const streams = this.filterStore.filter.streams;
			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: timestampToNumber(message.timestamp),
				streams: [...new Set([...streams, message.sessionId])],
			});
			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = message.messageId;
			this.graphStore.setTimestamp(timestampToNumber(message.timestamp));
			this.hintMessages = [];
			this.workspaceStore.viewStore.activePanel = this;
		}
	};

	@action
	public onAttachedMessagesChange = (attachedMessages: EventMessage[]) => {
		const shouldShowFilterHintBeforeRefetchingMessages = this.handleFilterHint(attachedMessages);

		if (
			this.dataStore.isLoadingNextMessages ||
			this.dataStore.isLoadingPreviousMessages ||
			shouldShowFilterHintBeforeRefetchingMessages
		) {
			return;
		}

		const mostRecentMessage = sortMessagesByTimestamp(attachedMessages)[0];

		if (mostRecentMessage) {
			this.filterStore.filter = {
				...this.filterStore.filter,
				streams: [...new Set([...attachedMessages.map(({ sessionId }) => sessionId)])],
				timestampTo: timestampToNumber(mostRecentMessage.timestamp),
			};
			this.selectedMessageId = new String(mostRecentMessage.messageId);
		}
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.hintMessages = [];

		this.filterStore.filter = {
			...this.filterStore.filter,
			timestampFrom: null,
			timestampTo: timestamp,
		};

		if (this.workspaceStore.viewStore.panelsLayout[1] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public clearFilters = () => {
		this.hintMessages = [];
		this.filterStore.resetMessagesFilter({ streams: this.filterStore.filter.streams });
		this.dataStore.stopMessagesLoading();
	};

	@action
	/*
		This method handles message select or attached messages change events.
		When those events occur we want to check if selected message or
		attached messages match current filter and streams. If it doesn't match
		filter change hint window is shown to a user. And it is up to him to decide
		if he wants to reset streams to message(s) streams and update filters
	*/
	private handleFilterHint = (message: EventMessage | EventMessage[]): boolean => {
		this.hintMessages = Array.isArray(message) ? message : [message];

		if (this.hintMessages.length === 0) {
			this.showFilterChangeHint = false;
			return this.showFilterChangeHint;
		}

		const sseFilter = this.filterStore.sseMessagesFilter;
		const areFiltersApplied = [
			sseFilter
				? [sseFilter.attachedEventIds.values, sseFilter.body.values, sseFilter.type.values].flat()
				: [],
		].some(filterValues => filterValues.length > 0);

		this.showFilterChangeHint = areFiltersApplied;

		return this.showFilterChangeHint;
	};

	@action
	public applyFilterHint = () => {
		if (!this.hintMessages.length) return;

		this.dataStore.searchChannelNext?.stop();
		this.dataStore.searchChannelPrev?.stop();

		const targetMessage: EventMessage = sortMessagesByTimestamp(this.hintMessages)[0];

		this.filterStore.resetMessagesFilter({
			streams: [...new Set(this.hintMessages.map(({ sessionId }) => sessionId))],
			timestampTo: timestampToNumber(targetMessage.timestamp),
			timestampFrom: null,
		});
		this.graphStore.setTimestamp(timestampToNumber(targetMessage.timestamp));

		this.hintMessages = [];
		this.selectedMessageId = new String(targetMessage.messageId);
		this.highlightedMessageId = targetMessage.messageId;
		this.showFilterChangeHint = false;
	};

	// Unsubcribe from reactions
	public dispose = () => {
		this.attachedMessagesSubscription();
		this.filterStore.dispose();
		this.dataStore.stopMessagesLoading();
	};

	private onMessageHover = (hoveredMessage: EventMessage | null) => {
		if (hoveredMessage !== null) {
			this.graphStore.setTimestamp(timestampToNumber(hoveredMessage.timestamp));
		}
	};
}
