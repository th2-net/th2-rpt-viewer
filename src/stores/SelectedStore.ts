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

import { action, computed, reaction, observable } from 'mobx';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './workspace/WorkspacesStore';
import localStorageWorker from '../util/LocalStorageWorker';
import { sortMessagesByTimestamp } from '../helpers/message';
import { isEventNode, sortByTimestamp } from '../helpers/event';
import { GraphItem } from '../models/Graph';
import { filterUniqueGraphItems } from '../helpers/graph';
import { isWorkspaceStore } from '../helpers/workspace';

export class SelectedStore {
	@observable.shallow
	public pinnedMessages: Array<EventMessage> = localStorageWorker.getPersistedPinnedMessages();

	@observable.shallow
	public pinnedEvents: Array<EventTreeNode> = localStorageWorker.getPersistedPinnedEvents();

	constructor(private workspacesStore: WorkspacesStore) {
		reaction(() => this.pinnedMessages, localStorageWorker.setPersistedPinnedMessages);

		reaction(() => this.pinnedEvents, localStorageWorker.setPersistedPinnedEvents);
	}

	@computed get savedItems(): Array<EventTreeNode | EventMessage> {
		return sortByTimestamp([...this.pinnedEvents, ...this.pinnedMessages]);
	}

	@computed get hoveredEvent(): EventTreeNode | null {
		return isWorkspaceStore(this.workspacesStore.activeWorkspace)
			? this.workspacesStore.activeWorkspace.eventsStore.hoveredEvent
			: null;
	}

	@computed get hoveredMessage(): EventMessage | null {
		return isWorkspaceStore(this.workspacesStore.activeWorkspace)
			? this.workspacesStore.activeWorkspace.messagesStore.hoveredMessage
			: null;
	}

	@computed get graphItems(): Array<GraphItem> {
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

	@computed get attachedMessages() {
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
		} else {
			this.removeSavedItem(message);
		}
	};

	@action
	public toggleEventPin = (event: EventTreeNode) => {
		if (this.pinnedEvents.findIndex(e => e.eventId === event.eventId) === -1) {
			this.pinnedEvents = this.pinnedEvents.concat(event);
		} else {
			this.pinnedEvents = this.pinnedEvents.filter(e => e.eventId !== event.eventId);
		}
	};

	@action
	public removeSavedItem(savedItem: EventTreeNode | EventMessage) {
		if (isEventNode(savedItem)) {
			this.pinnedEvents = this.pinnedEvents.filter(event => event.eventId !== savedItem.eventId);
		} else {
			this.pinnedMessages = this.pinnedMessages.filter(
				message => message.messageId !== savedItem.messageId,
			);
		}
	}
}
