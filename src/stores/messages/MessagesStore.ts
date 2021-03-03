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

import { action, computed, observable, toJS, reaction, IReactionDisposer } from 'mobx';
import moment from 'moment';
import { ListRange } from 'react-virtuoso';
import ApiSchema from '../../api/ApiSchema';
import FilterStore from '../FilterStore';
import { EventMessage } from '../../models/EventMessage';
import { getTimestampAsNumber } from '../../helpers/date';
import { TabTypes } from '../../models/util/Windows';
import MessagesFilter from '../../models/filter/MessagesFilter';
import { SelectedStore } from '../SelectedStore';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { isMessagesStore } from '../../helpers/stores';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';
import MessagesDataProviderStore from './MessagesDataProviderStore';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { isEventMessage } from '../../helpers/event';
import { MessageFilterState } from '../../components/search-panel/SearchPanelFilters';
import { GraphStore } from '../GraphStore';

export type MessagesStoreURLState = Partial<{
	type: TabTypes.Messages;
	filter: Partial<MessagesFilter>;
}>;

export type MessagesStoreDefaultStateType = MessagesStore | MessagesStoreURLState | null;

export default class MessagesStore {
	private attachedMessagesSubscription: IReactionDisposer;

	filterStore = new FilterStore(this.searchStore);

	data = new MessagesDataProviderStore(this, this.api);

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

	@observable
	public selectedMessage: EventMessage | null = null;

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private selectedStore: SelectedStore,
		private searchStore: SearchStore,
		private api: ApiSchema,
		defaultState: MessagesStoreDefaultStateType | EventMessage,
	) {
		if (isMessagesStore(defaultState)) {
			this.copy(defaultState);
		} else if (isEventMessage(defaultState)) {
			this.onMessageSelect(defaultState);
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

		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	@computed
	public get messageSessions(): string[] {
		return this.searchStore.messageSessions;
	}

	@computed
	public get panelRange(): TimeRange {
		const { startIndex, endIndex } = this.currentMessagesIndexesRange;

		const messageTo = this.data.messages[startIndex];
		const messageFrom = this.data.messages[endIndex];

		if (messageFrom && messageTo) {
			return [
				getTimestampAsNumber(messageFrom.timestamp),
				getTimestampAsNumber(messageTo.timestamp),
			];
		}
		const timestampTo = this.filterStore.messagesFilter.timestampTo || moment().utc().valueOf();
		return [timestampTo - 30 * 1000, timestampTo];
	}

	@computed
	get isActivePanel() {
		return this.workspaceStore.isActive && this.workspaceStore.viewStore.activePanel === this;
	}

	@action
	public setHoveredMessage(message: EventMessage | null) {
		this.hoveredMessage = message;
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
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.data.messages.findIndex(m => m.messageId === messageId);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	@action
	public applyFilter = (filter: MessagesFilter, sseFilters: MessageFilterState | null) => {
		this.selectedMessage = null;
		this.showFilterChangeHint = false;
		this.filterStore.setMessagesFilter(filter, sseFilters);
	};

	@action
	public applyStreams = () => {
		let targetMessage: EventMessage | null = null;
		if (this.selectedMessage) {
			targetMessage = this.selectedMessage;
		} else {
			targetMessage = sortMessagesByTimestamp(this.workspaceStore.attachedMessages)[0];
		}

		if (targetMessage) {
			this.filterStore.resetMessagesFilter({
				streams: this.selectedMessage
					? [this.selectedMessage.sessionId]
					: this.workspaceStore.attachedMessages.map(m => m.sessionId),

				timestampTo: getTimestampAsNumber(targetMessage.timestamp),
				timestampFrom: null,
			});
			this.graphStore.setTimestamp(getTimestampAsNumber(targetMessage.timestamp));
			this.selectedMessage = null;
			this.selectedMessageId = new String(targetMessage.messageId);
			this.highlightedMessageId = targetMessage.messageId;
			this.showFilterChangeHint = false;
		}
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};

	@action
	public onMessageSelect = async (message: EventMessage) => {
		const messagesFilter = this.filterStore.messagesFilter;
		const sseFilter = this.filterStore.sseMessagesFilter;

		const areFiltersApplied = [
			sseFilter
				? [sseFilter.attachedEventIds.values, sseFilter.body.values, sseFilter.type.values].flat()
				: [],
		].some(filterValues => filterValues.length > 0);

		if (
			(messagesFilter.streams.length === 0 || messagesFilter.streams.includes(message.sessionId)) &&
			!areFiltersApplied
		) {
			this.filterStore.resetMessagesFilter({
				timestampFrom: null,
				timestampTo: getTimestampAsNumber(message.timestamp),
				streams: [message.sessionId],
			});
			this.selectedMessageId = new String(message.messageId);
			this.highlightedMessageId = message.messageId;
			this.graphStore.setTimestamp(getTimestampAsNumber(message.timestamp));
			this.selectedMessage = null;
		} else {
			this.selectedMessage = message;
			this.handleFilterHint(message);
		}
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.selectedMessageId = null;
		this.highlightedMessageId = null;
		this.selectedMessageId = null;
		this.filterStore.messagesFilter = {
			...this.filterStore.messagesFilter,
			timestampFrom: null,
			timestampTo: timestamp,
		};

		if (this.workspaceStore.viewStore.panelsLayout[1] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public onAttachedMessagesChange = (attachedMessages: EventMessage[]) => {
		this.selectedMessage = null;
		if (
			this.data.messages.length !== 0 ||
			this.data.isLoadingNextMessages ||
			this.data.isLoadingPreviousMessages
		) {
			this.handleFilterHint(attachedMessages);
			return;
		}

		const mostRecentMessage = sortMessagesByTimestamp(attachedMessages)[0];

		if (mostRecentMessage) {
			this.graphStore.setTimestamp(getTimestampAsNumber(mostRecentMessage.timestamp));
			this.filterStore.messagesFilter = {
				...this.filterStore.messagesFilter,
				streams: [...new Set(attachedMessages.map(m => m.sessionId))],
				timestampTo: getTimestampAsNumber(mostRecentMessage.timestamp),
			};
			this.selectedMessageId = new String(mostRecentMessage.messageId);
		}
	};

	@action
	clearFilters = () => {
		this.selectedMessage = null;
		this.filterStore.resetMessagesFilter();
		this.data.stopMessagesLoading();
	};

	@action
	private copy(store: MessagesStore) {
		this.beautifiedMessages = toJS(store.beautifiedMessages.slice());
		this.detailedRawMessagesIds = toJS(store.detailedRawMessagesIds.slice());
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.selectedMessageId = store.selectedMessageId
			? new String(store.selectedMessageId.valueOf())
			: null;

		this.filterStore = new FilterStore(this.searchStore, {
			messagesFilter: toJS(store.filterStore.messagesFilter),
		});

		// TODO: handle copying of MessagesDataProviderStore
	}

	public dispose = () => {
		this.attachedMessagesSubscription();
		this.filterStore.dispose();
	};

	@action
	private handleFilterHint = (message: EventMessage | EventMessage[]) => {
		const sseFilter = this.filterStore.sseMessagesFilter;
		const areFiltersApplied = [
			sseFilter
				? [sseFilter.attachedEventIds.values, sseFilter.body.values, sseFilter.type.values].flat()
				: [],
		].some(filterValues => filterValues.length > 0);
		if (isEventMessage(message)) {
			this.showFilterChangeHint =
				!this.filterStore.messagesFilter.streams.includes(message.messageId) || areFiltersApplied;
		} else {
			this.showFilterChangeHint =
				message.some(m => !this.filterStore.messagesFilter.streams.includes(m.sessionId)) ||
				areFiltersApplied;
		}
	};
}
