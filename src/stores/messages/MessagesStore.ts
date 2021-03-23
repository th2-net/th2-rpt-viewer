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

import { action, computed, observable, reaction, IReactionDisposer, makeObservable } from 'mobx';
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

export type MessagesStoreURLState = MessagesFilterStoreInitialState;

export type MessagesStoreDefaultStateType =
	| (MessagesStoreURLState & {
			targetMessage?: EventMessage;
	  })
	| null
	| undefined;

export default class MessagesStore {
	private attachedMessagesSubscription: IReactionDisposer;

	public filterStore = new MessagesFilterStore(this.searchStore);

	public dataStore = new MessagesDataProviderStore(this, this.api);

	public hoveredMessage: EventMessage | null = null;

	public selectedMessageId: String | null = null;

	public scrolledIndex: Number | null = null;

	public highlightedMessageId: String | null = null;

	public detailedRawMessagesIds: Array<string> = [];

	public beautifiedMessages: Array<string> = [];

	public currentMessagesIndexesRange: ListRange = {
		startIndex: 0,
		endIndex: 0,
	};

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
		defaultState: MessagesStoreDefaultStateType,
	) {
		makeObservable<MessagesStore, 'onSelectedMessageIdChange' | 'handleFilterHint'>(this, {
			hoveredMessage: observable,
			selectedMessageId: observable,
			scrolledIndex: observable,
			highlightedMessageId: observable,
			detailedRawMessagesIds: observable,
			beautifiedMessages: observable,
			currentMessagesIndexesRange: observable,
			showFilterChangeHint: observable,
			messageSessions: computed,
			attachedMessages: computed,
			panelRange: computed,
			setHoveredMessage: action,
			showDetailedRawMessage: action,
			hideDetailedRawMessage: action,
			beautify: action,
			debeautify: action,
			scrollToMessage: action,
			applyFilter: action,
			onSelectedMessageIdChange: action,
			onMessageSelect: action,
			onAttachedMessagesChange: action,
			onRangeChange: action,
			clearFilters: action,
			handleFilterHint: action,
			applyFilterHint: action,
		});

		if (defaultState) {
			this.filterStore = new MessagesFilterStore(this.searchStore, defaultState);
			const message = defaultState.targetMessage;
			if (isEventMessage(message)) {
				this.selectedMessageId = new String(message.messageId);
				this.highlightedMessageId = message.messageId;
				this.graphStore.setTimestamp(timestampToNumber(message.timestamp));
				this.workspaceStore.viewStore.activePanel = this;
			}

			this.dataStore.loadMessages();
		}

		this.attachedMessagesSubscription = reaction(
			() => this.workspaceStore.attachedMessages,
			this.onAttachedMessagesChange,
		);

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	public get messageSessions(): string[] {
		return this.searchStore.messageSessions;
	}

	public get attachedMessages(): EventMessage[] {
		return this.workspaceStore.attachedMessages;
	}

	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;

		const messageTo = this.dataStore.messages[startIndex];
		const messageFrom = this.dataStore.messages[endIndex];

		if (messageFrom && messageTo) {
			return [timestampToNumber(messageFrom.timestamp), timestampToNumber(messageTo.timestamp)];
		}
		const timestampTo = this.filterStore.filter.timestampTo || moment().utc().valueOf();
		return [timestampTo - 30 * 1000, timestampTo];
	}

	public setHoveredMessage(message: EventMessage | null): void {
		this.hoveredMessage = message;
	}

	public showDetailedRawMessage = (messageId: string): void => {
		if (!this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	public hideDetailedRawMessage = (messageId: string): void => {
		this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
	};

	public beautify = (messageId: string): void => {
		if (!this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	public debeautify = (messageId: string): void => {
		this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
	};

	public scrollToMessage = (messageId: string): void => {
		const messageIndex = this.dataStore.messages.findIndex(m => m.messageId === messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	public applyFilter = (
		filter: MessagesFilter,
		sseFilters: MessageFilterState | null,
		isSoftFilterApplied: boolean,
	): void => {
		this.hintMessages = [];
		this.showFilterChangeHint = false;
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.filterStore.setMessagesFilter(filter, sseFilters, isSoftFilterApplied);
	};

	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	public onMessageSelect = async (message: EventMessage): Promise<void> => {
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

	public onAttachedMessagesChange = (attachedMessages: EventMessage[]): void => {
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
			const streams = this.filterStore.filter.streams;
			this.filterStore.filter = {
				...this.filterStore.filter,
				streams: [...new Set([...streams, ...attachedMessages.map(({ sessionId }) => sessionId)])],
				timestampTo: timestampToNumber(mostRecentMessage.timestamp),
			};
			this.selectedMessageId = new String(mostRecentMessage.messageId);
		}
	};

	public onRangeChange = (timestamp: number): void => {
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

	public clearFilters = (): void => {
		this.hintMessages = [];
		this.filterStore.resetMessagesFilter();
		this.dataStore.stopMessagesLoading();
	};

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

	public applyFilterHint = (): void => {
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
	public dispose = (): void => {
		this.attachedMessagesSubscription();
		this.filterStore.dispose();
		this.dataStore.stopMessagesLoading();
	};
}
