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

import { isEventNode } from '../helpers/event';
import { isMessage } from '../helpers/message';
import { EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';

enum LocalStorageEntities {
	PINNED_MESSAGES = 'pinnedMessages',
	EVENTS = 'events',
}
class LocalStorageWorker {
	getPersistedPinnedMessages(): EventMessage[] {
		try {
			const pinnedMessages = localStorage.getItem(LocalStorageEntities.PINNED_MESSAGES);
			const parsedMessages = pinnedMessages ? JSON.parse(pinnedMessages) : [];
			return Array.isArray(parsedMessages) ? parsedMessages.filter(isMessage) : [];
		} catch (error) {
			return [];
		}
	}

	getPersistedPinnedEvents(): EventTreeNode[] {
		try {
			const pinnedEventsNodes = localStorage.getItem(LocalStorageEntities.EVENTS);
			const parsedEventNodes = pinnedEventsNodes ? JSON.parse(pinnedEventsNodes) : [];
			return Array.isArray(parsedEventNodes) ? parsedEventNodes.filter(isEventNode) : [];
		} catch (error) {
			return [];
		}
	}

	setPersistedPinnedMessages(pinnedMessages: EventMessage[]) {
		localStorage.setItem(LocalStorageEntities.PINNED_MESSAGES, JSON.stringify(pinnedMessages));
	}

	setPersistedPinnedEvents(pinnedEvents: EventTreeNode[]) {
		localStorage.setItem(LocalStorageEntities.EVENTS, JSON.stringify(pinnedEvents));
	}
}

const localStorageWorker = new LocalStorageWorker();

export default localStorageWorker;
