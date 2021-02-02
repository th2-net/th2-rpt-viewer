/** ****************************************************************************
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

import { action, computed, observable, reaction } from 'mobx';
import { nanoid } from 'nanoid';
import MessagesStore, {
	MessagesStoreDefaultStateType,
	MessagesStoreURLState,
} from '../messages/MessagesStore';
import EventsStore, { EventStoreDefaultStateType, EventStoreURLState } from '../events/EventsStore';
import ApiSchema from '../../api/ApiSchema';
import { SelectedStore } from '../SelectedStore';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { GraphDataStore } from '../graph/GraphDataStore';
import { isEventsStore, isMessagesStore } from '../../helpers/stores';
import { getTimestampAsNumber } from '../../helpers/date';
import { isEventAction, isEventNode } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import WorkspacesStore from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState>;
	messages: Partial<MessagesStoreURLState>;
	timeRange: TimeRange | null;
	interval: number | null;
	layout: WorkspacePanelsLayout;
}

export type WorkspaceInitialState = Partial<{
	events: EventStoreDefaultStateType;
	messages: MessagesStoreDefaultStateType;
	timeRange: TimeRange | null;
	interval: number | null;
	layout: WorkspacePanelsLayout;
}>;

export default class WorkspaceStore {
	public eventsStore: EventsStore;

	public messagesStore: MessagesStore;

	public viewStore: WorkspaceViewStore;

	public graphDataStore: GraphDataStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private selectedStore: SelectedStore,
		private api: ApiSchema,
		initialState: WorkspaceInitialState,
	) {
		this.graphDataStore = new GraphDataStore(this.selectedStore, initialState.timeRange);
		this.eventsStore = new EventsStore(
			this,
			this.selectedStore,
			this.graphDataStore,
			this.api,
			initialState.events || null,
		);
		this.messagesStore = new MessagesStore(
			this,
			this.selectedStore,
			this.graphDataStore,
			this.api,
			initialState.messages || null,
		);
		this.viewStore = new WorkspaceViewStore({ panelsLayout: initialState.layout });

		reaction(() => this.attachedMessagesIds, this.getAttachedMessages);

		reaction(() => this.eventsStore.selectedEvent, this.onSelectedEventChange);
	}

	private panelUpdateTimer: NodeJS.Timeout | null = null;

	@observable
	public attachedMessagesIds: Array<string> = [];

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	public isLoadingAttachedMessages = false;

	@computed get isActive() {
		return this.workspacesStore.activeWorkspace === this;
	}

	@computed get attachedMessagesStreams() {
		return [...new Set(this.attachedMessages.map(msg => msg.sessionId))];
	}

	@action
	public setAttachedMessagesIds = (attachedMessageIds: string[]) => {
		this.attachedMessagesIds = [...new Set(attachedMessageIds)];
	};

	private attachedMessagesAC: AbortController | null = null;

	@action
	private getAttachedMessages = async (attachedMessagesIds: string[]) => {
		this.isLoadingAttachedMessages = true;
		if (this.attachedMessagesAC) {
			this.attachedMessagesAC.abort();
		}
		this.attachedMessagesAC = new AbortController();
		try {
			const cachedMessages = this.attachedMessages.filter(message =>
				attachedMessagesIds.includes(message.messageId),
			);
			const messagesToLoad = attachedMessagesIds.filter(
				messageId => cachedMessages.findIndex(message => message.messageId === messageId) === -1,
			);
			const messages = await Promise.all(
				messagesToLoad.map(id => this.api.messages.getMessage(id, this.attachedMessagesAC?.signal)),
			);
			this.attachedMessages = sortMessagesByTimestamp(
				[...cachedMessages, ...messages].filter(Boolean),
			);
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading attached messages', error);
			}
			this.attachedMessages = [];
		} finally {
			this.attachedMessagesAC = null;
			this.isLoadingAttachedMessages = false;
		}
	};

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		this.graphDataStore.timestamp = isEventNode(savedItem)
			? getTimestampAsNumber(savedItem.startTimestamp)
			: isEventAction(savedItem)
			? getTimestampAsNumber(savedItem.startTimestamp)
			: getTimestampAsNumber(savedItem.timestamp);
		if (isEventNode(savedItem) || isEventAction(savedItem)) {
			this.eventsStore.onSavedItemSelect(savedItem);
		} else {
			this.messagesStore.onSavedItemSelect(savedItem);
		}
	};

	@action
	private onSelectedEventChange = (selectedEvent: EventAction | null) => {
		this.setAttachedMessagesIds(selectedEvent ? selectedEvent.attachedMessageIds : []);
	};

	@action
	public onRangeChange = (range: TimeRange) => {
		const [timestampFrom, timestampTo] = range;
		if (this.panelUpdateTimer) {
			clearTimeout(this.panelUpdateTimer);
		}
		this.panelUpdateTimer = setTimeout(() => {
			if (isEventsStore(this.viewStore.activePanel)) {
				const eventsFilter = this.viewStore.activePanel.filterStore.eventsFilter;
				this.viewStore.activePanel.filterStore.eventsFilter = {
					eventTypes: eventsFilter.eventTypes,
					names: eventsFilter.names,
					timestampFrom,
					timestampTo,
				};
			} else if (isMessagesStore(this.viewStore.activePanel)) {
				const messageFilter = this.viewStore.activePanel?.filterStore.messagesFilter;
				this.viewStore.activePanel.filterStore.messagesFilter = {
					messageTypes: messageFilter ? messageFilter.messageTypes : [],
					streams: messageFilter ? messageFilter.streams : [],
					timestampFrom,
					timestampTo,
				};
			}
		}, 800);
	};
}
