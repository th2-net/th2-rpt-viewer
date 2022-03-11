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

export class SelectedStore {
	constructor(private workspacesStore: WorkspacesStore) {}

	@computed
	public get hoveredEvent(): EventTreeNode | null {
		return this.workspacesStore.activeWorkspace.eventsStore.hoveredEvent;
	}

	@computed
	public get savedItems(): Array<EventTreeNode | EventMessage> {
		return this.workspacesStore.persistedDataStore.pinnedItems?.savedItems || [];
	}

	@computed
	public get hoveredMessage(): EventMessage | null {
		return this.workspacesStore.activeWorkspace.messagesStore.hoveredMessage;
	}

	@computed
	public get graphItems(): Array<GraphItem> {
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
		return sortMessagesByTimestamp(this.workspacesStore.activeWorkspace.attachedMessages);
	}
}
