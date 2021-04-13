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

import { action, computed, observable, runInAction } from 'mobx';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './workspace/WorkspacesStore';
import { sortMessagesByTimestamp } from '../helpers/message';
import { isEventNode, sortByTimestamp } from '../helpers/event';
import { GraphItem } from '../models/Graph';
import { filterUniqueGraphItems } from '../helpers/graph';
import { isWorkspaceStore } from '../helpers/workspace';
import { IndexedDB, IndexedDbStores } from '../api/indexedDb';

export class SelectedStore {
	@observable.shallow
	public pinnedMessages: Array<EventMessage> = [];

	@observable.shallow
	public pinnedEvents: Array<EventTreeNode> = [];

	constructor(private workspacesStore: WorkspacesStore, private db: IndexedDB) {
		this.init();
	}

	@computed
	public get savedItems(): Array<EventTreeNode | EventMessage> {
		return sortByTimestamp([...this.pinnedEvents, ...this.pinnedMessages]);
	}

	@computed
	public get hoveredEvent(): EventTreeNode | null {
		return isWorkspaceStore(this.workspacesStore.activeWorkspace)
			? this.workspacesStore.activeWorkspace.eventsStore.hoveredEvent
			: null;
	}

	@computed
	public get hoveredMessage(): EventMessage | null {
		return isWorkspaceStore(this.workspacesStore.activeWorkspace)
			? this.workspacesStore.activeWorkspace.messagesStore.hoveredMessage
			: null;
	}

	@computed
	public get graphItems(): Array<GraphItem> {
		if (!isWorkspaceStore(this.workspacesStore.activeWorkspace)) return [];

		const items = [...this.savedItems, ...this.workspacesStore.activeWorkspace.attachedMessages];

		const selectedEvent = this.workspacesStore.activeWorkspace.eventsStore.selectedNode;

		if (selectedEvent) {
			items.push(selectedEvent);
		}

		if (this.hoveredEvent) {
			items.push(this.hoveredEvent);
		}

		if (this.hoveredMessage) {
			items.push(this.hoveredMessage);
		}

		return sortByTimestamp(filterUniqueGraphItems(items));
	}

	@computed
	public get attachedMessages() {
		return sortMessagesByTimestamp(
			isWorkspaceStore(this.workspacesStore.activeWorkspace)
				? this.workspacesStore.activeWorkspace.attachedMessages
				: [],
		);
	}

	@action
	public toggleMessagePin = (message: EventMessage) => {
		if (this.pinnedMessages.findIndex(m => m.messageId === message.messageId) === -1) {
			this.pinnedMessages = this.pinnedMessages.concat(message);
			this.db.addDbStoreItem(IndexedDbStores.MESSAGES, message);
		} else {
			this.removeSavedItem(message);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, message.messageId);
		}
	};

	@action
	public toggleEventPin = async (event: EventTreeNode) => {
		if (this.pinnedEvents.findIndex(e => e.eventId === event.eventId) === -1) {
			this.db.addDbStoreItem(IndexedDbStores.EVENTS, event);
			this.pinnedEvents = this.pinnedEvents.concat(event);
		} else {
			this.pinnedEvents = this.pinnedEvents.filter(e => e.eventId !== event.eventId);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, event.eventId);
		}
	};

	@action
	public removeSavedItem = async (savedItem: EventTreeNode | EventMessage) => {
		if (isEventNode(savedItem)) {
			this.pinnedEvents = this.pinnedEvents.filter(event => event.eventId !== savedItem.eventId);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, savedItem.eventId);
		} else {
			this.pinnedMessages = this.pinnedMessages.filter(
				message => message.messageId !== savedItem.messageId,
			);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, savedItem.messageId);
		}
	};

	private init = () => {
		this.getSavedEvents();
		this.getSavedMessages();
	};

	private getSavedEvents = async () => {
		try {
			const savedEvents = await this.db.getStoreValues<EventTreeNode>(IndexedDbStores.EVENTS);
			runInAction(() => {
				this.pinnedEvents = savedEvents;
			});
		} catch (error) {
			console.error('Failed to fetch saved events');
		}
	};

	private getSavedMessages = async () => {
		try {
			const savedMessages = await this.db.getStoreValues<EventMessage>(IndexedDbStores.MESSAGES);
			runInAction(() => {
				this.pinnedMessages = savedMessages;
			});
		} catch (error) {
			console.error('Failed to fetch saved messages');
		}
	};
}
