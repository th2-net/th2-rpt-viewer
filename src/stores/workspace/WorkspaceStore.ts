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
import moment from 'moment';
import { nanoid } from 'nanoid';
import MessagesStore, {
	MessagesStoreDefaultStateType,
	MessagesStoreURLState,
} from '../messages/MessagesStore';
import EventsStore, { EventStoreDefaultStateType, EventStoreURLState } from '../events/EventsStore';
import ApiSchema from '../../api/ApiSchema';
import { SelectedStore } from '../SelectedStore';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage, MessageDisplayRule, MessageViewType } from '../../models/EventMessage';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { GraphStore } from '../GraphStore';
import { isEventMessage } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import WorkspacesStore from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { SearchStore } from '../SearchStore';
import localStorageWorker from '../../util/LocalStorageWorker';

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

	public graphStore: GraphStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private selectedStore: SelectedStore,
		private searchStore: SearchStore,
		private api: ApiSchema,
		initialState: WorkspaceInitialState,
	) {
		this.viewStore = new WorkspaceViewStore({
			panelsLayout: initialState.layout,
		});
		this.graphStore = new GraphStore(this.selectedStore, initialState.timeRange);
		this.eventsStore = new EventsStore(
			this,
			this.graphStore,
			this.searchStore,
			this.api,
			initialState.events,
		);
		this.messagesStore = new MessagesStore(
			this,
			this.graphStore,
			this.selectedStore,
			this.searchStore,
			this.api,
			initialState.messages,
		);

		reaction(() => this.attachedMessagesIds, this.getAttachedMessages);

		reaction(() => this.eventsStore.selectedEvent, this.onSelectedEventChange);
	}

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
		if (isEventMessage(savedItem)) {
			this.viewStore.activePanel = this.messagesStore;
			this.messagesStore.onMessageSelect(savedItem);
		} else {
			this.viewStore.activePanel = this.eventsStore;
			this.eventsStore.onEventSelect(savedItem);
		}
	};

	@action
	public onTimestampSelect = (timestamp: number) => {
		this.graphStore.setTimestamp(timestamp);
	};

	@action
	private onSelectedEventChange = (selectedEvent: EventAction | null) => {
		this.setAttachedMessagesIds(selectedEvent ? selectedEvent.attachedMessageIds : []);
	};
}

export function getRangeFromTimestamp(timestamp: number, interval: number): TimeRange {
	return [
		moment(timestamp)
			.subtract(interval / 2, 'minutes')
			.valueOf(),
		moment(timestamp)
			.add(interval / 2, 'minutes')
			.valueOf(),
	];
}
