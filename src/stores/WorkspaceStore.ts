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

import { action, observable, reaction } from 'mobx';
import MessagesStore, { MessagesStoreURLState } from './MessagesStore';
import EventsStore, { EventStoreURLState } from './EventsStore';
import ApiSchema from '../api/ApiSchema';
import { SelectedStore } from './SelectedStore';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../models/EventMessage';
import { EventAction } from '../models/EventAction';
import { sortMessagesByTimestamp } from '../helpers/message';
import GraphStore from './GraphStore';
import { isEventsStore, isMessagesStore } from '../helpers/stores';
import { getTimestampAsNumber } from '../helpers/date';
import { isEventAction } from '../helpers/event';

export type EventStoreDefaultStateType = EventsStore | EventStoreURLState | null;
export type MessagesStoreDefaultStateType = MessagesStore | null;

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState>;
	messages: Partial<MessagesStoreURLState>;
}

export default class WorkspaceStore {
	@observable eventsStore: EventsStore;

	@observable messagesStore: MessagesStore;

	@observable viewStore: WorkspaceViewStore;

	constructor(
		private selectedStore: SelectedStore,
		private api: ApiSchema,
		public graphStore: GraphStore,
		eventDefaultState: EventStoreDefaultStateType = null,
		messagesDefaultState: MessagesStoreDefaultStateType = null,
	) {
		this.eventsStore = new EventsStore(this, this.selectedStore, this.api, eventDefaultState);
		this.messagesStore = new MessagesStore(
			this,
			this.selectedStore,
			this.api,
			messagesDefaultState,
		);
		this.viewStore = new WorkspaceViewStore();

		reaction(() => this.attachedMessagesIds, this.getAttachedMessages);

		reaction(() => this.eventsStore.selectedEvent, this.onSelectedEventChange);
	}

	@observable
	public panelUpdateTimer: NodeJS.Timeout | null = null;

	@observable
	public attachedMessagesIds: Array<string> = [];

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	public isLoadingAttachedMessages = false;

	@action
	private onSelectedEventChange = (selectedEvent: EventAction | null) => {
		this.setAttachedMessagesIds(selectedEvent ? selectedEvent.attachedMessageIds : []);
	};

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
			const attachedMessages = await Promise.all(
				messagesToLoad.map(id => this.api.messages.getMessage(id, this.attachedMessagesAC?.signal)),
			);
			this.attachedMessages = sortMessagesByTimestamp(
				[...cachedMessages, ...attachedMessages].filter(Boolean),
			);
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Error while loading attached messages', error);
			}
		} finally {
			this.attachedMessagesAC = null;
			this.isLoadingAttachedMessages = false;
		}
	};

	@action
	onSavedItemSelect = (savedItem: EventAction | EventMessage) => {
		this.graphStore.timestamp = isEventAction(savedItem)
			? getTimestampAsNumber(savedItem.startTimestamp)
			: getTimestampAsNumber(savedItem.timestamp);
		if (isEventAction(savedItem)) {
			this.eventsStore.onSavedItemSelect(savedItem);
		} else {
			this.messagesStore.onSavedItemSelect(savedItem);
		}
	};

	@action
	public onRangeChange = (range: [number, number]) => {
		if (this.panelUpdateTimer) {
			clearTimeout(this.panelUpdateTimer);
		}
		this.panelUpdateTimer = setTimeout(() => {
			const [timestampFrom, timestampTo] = range;
			if (isEventsStore(this.viewStore.activePanel)) {
				const eventsFilter = this.viewStore.activePanel.filterStore.eventsFilter;
				this.viewStore.activePanel.filterStore.eventsFilter = {
					timestampFrom,
					timestampTo,
					eventTypes: eventsFilter.eventTypes,
					names: eventsFilter.names,
				};
			} else if (isMessagesStore(this.viewStore.activePanel)) {
				const messageFilter = this.viewStore.activePanel?.filterStore.messagesFilter;
				this.viewStore.activePanel.filterStore.messagesFilter = {
					timestampFrom,
					timestampTo,
					messageTypes: messageFilter ? messageFilter.messageTypes : [],
					streams: messageFilter ? messageFilter.streams : [],
				};
			}
		}, 800);
	};
}
