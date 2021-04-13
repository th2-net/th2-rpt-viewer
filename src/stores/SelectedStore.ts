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
import moment from 'moment';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './workspace/WorkspacesStore';
import { sortMessagesByTimestamp } from '../helpers/message';
import { sortByTimestamp } from '../helpers/event';
import { GraphItem } from '../models/Graph';
import { filterUniqueGraphItems } from '../helpers/graph';
import { isWorkspaceStore } from '../helpers/workspace';
import { IndexedDB, IndexedDbStores } from '../api/indexedDb';
import {
	EventBookmark,
	MessageBookmark,
	Bookmark,
	isEventBookmark,
	isMessageBookmark,
} from '../components/BookmarksPanel';

export class SelectedStore {
	@observable.shallow
	public bookmarkedMessages: MessageBookmark[] = [];

	@observable.shallow
	public bookmarkedEvents: EventBookmark[] = [];

	constructor(private workspacesStore: WorkspacesStore, private db: IndexedDB) {
		this.init();
	}

	@computed
	public get savedItems(): Array<EventTreeNode | EventMessage> {
		return sortByTimestamp([
			...this.bookmarkedEvents.map(bookmark => bookmark.item),
			...this.bookmarkedMessages.map(bookmark => bookmark.item),
		]);
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
		const bookmark = this.bookmarkedMessages.find(
			messageBookmark => messageBookmark.id === message.messageId,
		);
		if (bookmark) {
			this.removeBookmark(bookmark);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, bookmark.id);
		} else {
			const messageBookmark = this.createMessageBookmark(message);
			this.bookmarkedMessages = this.bookmarkedMessages.concat(messageBookmark);
			this.db.addDbStoreItem(IndexedDbStores.MESSAGES, messageBookmark);
		}
	};

	@action
	public toggleEventPin = async (event: EventTreeNode) => {
		const bookmark = this.bookmarkedEvents.find(
			eventBookmark => eventBookmark.id === event.eventId,
		);
		if (bookmark) {
			this.bookmarkedEvents = this.bookmarkedEvents.filter(
				eventBookmark => eventBookmark !== bookmark,
			);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, bookmark.id);
		} else {
			const eventBookmark = this.createEventBookmark(event);
			this.bookmarkedEvents = this.bookmarkedEvents.concat(eventBookmark);
			this.db.addDbStoreItem(IndexedDbStores.EVENTS, eventBookmark);
		}
	};

	@action
	public removeBookmark = async (bookmark: Bookmark) => {
		if (isEventBookmark(bookmark)) {
			this.bookmarkedEvents = this.bookmarkedEvents.filter(
				eventBookmark => eventBookmark !== bookmark,
			);
			this.db.deleteDbStoreItem(IndexedDbStores.EVENTS, bookmark.id);
		}

		if (isMessageBookmark(bookmark)) {
			this.bookmarkedMessages = this.bookmarkedMessages.filter(
				messageBookmark => messageBookmark !== bookmark,
			);
			this.db.deleteDbStoreItem(IndexedDbStores.MESSAGES, bookmark.id);
		}
	};

	private init = () => {
		this.getSavedEvents();
		this.getSavedMessages();
	};

	private getSavedEvents = async () => {
		try {
			const savedEvents = await this.db.getStoreValues<EventBookmark>(IndexedDbStores.EVENTS);
			runInAction(() => {
				this.bookmarkedEvents = savedEvents;
			});
		} catch (error) {
			console.error('Failed to fetch saved events');
		}
	};

	private getSavedMessages = async () => {
		try {
			const savedMessages = await this.db.getStoreValues<MessageBookmark>(IndexedDbStores.MESSAGES);
			runInAction(() => {
				this.bookmarkedMessages = savedMessages;
			});
		} catch (error) {
			console.error('Failed to fetch saved messages');
		}
	};

	private createMessageBookmark = (message: EventMessage): MessageBookmark => {
		return {
			id: message.messageId,
			searchTimestamp: moment.utc().valueOf(),
			item: message,
		};
	};

	private createEventBookmark = (event: EventTreeNode): EventBookmark => {
		return {
			id: event.eventId,
			searchTimestamp: moment.utc().valueOf(),
			item: event,
		};
	};
}
