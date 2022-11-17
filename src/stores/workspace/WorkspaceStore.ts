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
import { GraphStore } from '../GraphStore';
import { isEventMessage } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import WorkspacesStore from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { SearchStore } from '../SearchStore';
import { SessionsStore } from '../messages/SessionsStore';
import { isAbortError } from '../../helpers/fetch';
import MessagesViewTypesStore from '../messages/MessagesViewTypesStore';
import MessageDisplayRulesStore from '../MessageDisplayRulesStore';
import { IndexedDbStores, Settings } from '../../api/indexedDb';
import notificationsStore from '../NotificationsStore';
import { getArrayOfUniques } from '../../helpers/array';

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState> | string;
	messages: Partial<MessagesStoreURLState> | string;
	timeRange?: TimeRange;
	interval: number | null;
	layout: WorkspacePanelsLayout;
}

export type WorkspaceInitialState = Partial<{
	events: EventStoreDefaultStateType;
	messages: MessagesStoreDefaultStateType;
	timeRange?: TimeRange;
	interval: number | null;
	layout: WorkspacePanelsLayout;
}>;

export default class WorkspaceStore {
	public eventsStore: EventsStore;

	public messagesStore: MessagesStore;

	public messageViewTypesStore: MessagesViewTypesStore;

	public viewStore: WorkspaceViewStore;

	public graphStore: GraphStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private selectedStore: SelectedStore,
		private searchStore: SearchStore,
		private sessionsStore: SessionsStore,
		private messageDisplayRulesStore: MessageDisplayRulesStore,
		private api: ApiSchema,
		initialState: WorkspaceInitialState,
		interval: number,
	) {
		this.viewStore = new WorkspaceViewStore({
			panelsLayout: initialState.layout,
		});
		this.graphStore = new GraphStore(this.selectedStore, initialState.timeRange, interval);
		this.eventsStore = new EventsStore(
			this,
			this.graphStore,
			this.searchStore,
			this.api,
			this.workspacesStore.filtersHistoryStore,
			initialState.events,
		);
		this.messagesStore = new MessagesStore(
			this,
			this.graphStore,
			this.selectedStore,
			this.searchStore,
			this.api,
			this.workspacesStore.filtersHistoryStore,
			this.sessionsStore,
			initialState.messages,
		);

		this.messageViewTypesStore = new MessagesViewTypesStore(
			this.messageDisplayRulesStore,
			this.messagesStore,
		);

		reaction(() => this.attachedMessagesIds, this.getAttachedMessages);

		reaction(() => this.eventsStore.selectedEvent, this.onSelectedEventChange);

		reaction(() => this.graphStore.eventInterval, this.saveInterval);
	}

	private saveInterval = (interval: number) => {
		this.api.indexedDb
			.updateDbStoreItem<Settings>(IndexedDbStores.SETTINGS, {
				timestamp: 0,
				interval,
			})
			.catch(() => {
				this.api.indexedDb.addDbStoreItem<Settings>(IndexedDbStores.SETTINGS, {
					timestamp: 0,
					interval,
				});
			});
	};

	@observable
	public attachedMessagesIds: Array<string> = [];

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	public isLoadingAttachedMessages = false;

	@computed
	public get attachedMessagesStreams() {
		return [...new Set(this.attachedMessages.map(msg => msg.sessionId))];
	}

	@computed
	public get isActive(): boolean {
		return this.workspacesStore.activeWorkspace === this;
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
			const newStreams = getArrayOfUniques([
				...messages.map(message => message.sessionId),
				...this.messagesStore.filterStore.filter.streams,
			]);

			messages
				.map(message => message.sessionId)
				.filter(
					(stream, index, self) =>
						index === self.findIndex(str => str === stream) &&
						!newStreams.slice(0, this.messagesStore.filterStore.SESSIONS_LIMIT).includes(stream),
				)
				.forEach(stream =>
					notificationsStore.addMessage({
						notificationType: 'genericError',
						type: 'error',
						header: `Sessions limit of ${this.messagesStore.filterStore.SESSIONS_LIMIT} reached.`,
						description: `Session ${stream} not included in current sessions. 
						 Attached messages from this session not included in workspace.`,
						id: nanoid(),
					}),
				);

			const messagesFiltered = messages.filter(message =>
				newStreams
					.slice(0, this.messagesStore.filterStore.SESSIONS_LIMIT)
					.includes(message.sessionId),
			);

			this.attachedMessages = sortMessagesByTimestamp(
				[...cachedMessages, ...messagesFiltered].filter(Boolean),
			);
		} catch (error) {
			if (!isAbortError(error)) {
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
		if (isEventMessage(savedItem)) {
			this.messagesStore.exportStore.disableExport();
			this.viewStore.activePanel = this.messagesStore;
			this.messagesStore.onMessageSelect(savedItem);
		} else {
			this.viewStore.activePanel = this.eventsStore;
			this.eventsStore.goToEvent(savedItem);
		}
	};

	@action
	public onTimestampSelect = (timestamp: number, isTimestampApplied?: boolean) => {
		this.graphStore.setTimestamp(timestamp);
		if (isTimestampApplied) {
			this.eventsStore.onRangeChange(timestamp);
		}
	};

	@action
	private onSelectedEventChange = (selectedEvent: EventAction | null) => {
		this.setAttachedMessagesIds(selectedEvent ? selectedEvent.attachedMessageIds : []);
	};

	stopAttachedMessagesLoading = () => {
		if (this.attachedMessagesAC) {
			this.attachedMessagesAC.abort();
			this.attachedMessagesAC = null;
		}
	};

	dispose = () => {
		// Delete all subscriptions and cancel pending requests
		this.messagesStore.dispose();
		this.eventsStore.dispose();
	};
}
