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

import { computed } from 'mobx';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './workspace/WorkspacesStore';
import { sortMessagesByTimestamp } from '../helpers/message';
import { sortByTimestamp } from '../helpers/event';
import { GraphItem } from '../models/Graph';
import { filterUniqueGraphItems } from '../helpers/graph';
import { isWorkspaceStore } from '../helpers/workspace';
import { IndexedDB } from '../api/indexedDb';
import { BookmarksStore } from './BookmarksStore';
import BooksStore from './BooksStore';

export class SelectedStore {
	bookmarksStore: BookmarksStore;

	constructor(
		private workspacesStore: WorkspacesStore,
		private db: IndexedDB,
		booksStore: BooksStore,
	) {
		this.bookmarksStore = new BookmarksStore(workspacesStore, db, booksStore);
	}

	@computed
	public get savedItems(): Array<GraphItem> {
		return sortByTimestamp([
			...this.bookmarksStore.events.map(bookmark => bookmark.item),
			...this.bookmarksStore.messages.map(bookmark => bookmark.item),
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
}
