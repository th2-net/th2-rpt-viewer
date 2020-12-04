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
import ApiSchema from '../api/ApiSchema';
import { randomHexColor } from '../helpers/color';
import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import WorkspacesStore from './WorkspacesStore';
import localStorageWorker from '../util/LocalStorageWorker';
import { sortMessagesByTimestamp } from '../helpers/message';

export class SelectedStore {
	private readonly defaultColors = [
		'#997AB8',
		'#00BBCC',
		'#FF5500',
		'#1F66AD',
		'#E69900',
		'#45A155',
	];

	@observable
	public eventColors: Map<string, string> = new Map();

	@observable
	public pinnedMessages: Array<EventMessage> = localStorageWorker.getPersistedPinnedMessages();

	@observable
	public pinnedEvents: Array<EventAction> = [];

	constructor(private workspacesStore: WorkspacesStore, private api: ApiSchema) {
		reaction(
			() => this.selectedEvents,
			selectedEvents => {
				this.getEventColors(selectedEvents);
			},
		);

		reaction(
			() => this.pinnedMessages,
			pinnedMessages => localStorageWorker.setPersistedPinnedMessages(pinnedMessages),
		);
	}

	@computed get selectedEvents() {
		return this.workspacesStore.eventStores
			.map(eventStore => eventStore.selectedEvent)
			.filter(
				(event, i, self): event is EventAction =>
					event !== null && self.findIndex(e => e && e.eventId === event.eventId) === i,
			);
	}

	@computed get isLoadingEvents() {
		return this.workspacesStore.eventStores.some(eventStore => eventStore.isSelectedEventLoading);
	}

	@computed get attachedMessages() {
		return sortMessagesByTimestamp(
			this.workspacesStore.workspaces.flatMap(workspace => workspace.attachedMessages),
		);
	}

	@action
	public toggleMessagePin = (message: EventMessage) => {
		if (this.pinnedMessages.findIndex(m => m.messageId === message.messageId) === -1) {
			this.pinnedMessages = this.pinnedMessages.concat(message);
		} else {
			this.removePinnedMessage(message);
		}
		localStorageWorker.setPersistedPinnedMessages(this.pinnedMessages);
	};

	@action
	public removePinnedMessage = (removedMessage: EventMessage) => {
		this.pinnedMessages = this.pinnedMessages.filter(
			message => message.messageId !== removedMessage.messageId,
		);
	};

	@action
	private getEventColors = (selectedEvents: EventAction[]) => {
		const eventsWithAttachedMessages = selectedEvents.filter(
			event => event.attachedMessageIds.length > 0,
		);

		const usedColors: Array<string> = [];
		for (const [eventId, color] of this.eventColors.entries()) {
			if (eventsWithAttachedMessages.findIndex(e => e.eventId === eventId) !== -1) {
				usedColors.push(color);
			}
		}
		const availableColors = this.defaultColors.slice().filter(color => !usedColors.includes(color));

		const updatedEventColorsMap = new Map<string, string>();

		eventsWithAttachedMessages.forEach(({ eventId }) => {
			let color = this.eventColors.get(eventId);
			if (!color) {
				color = availableColors[0] || randomHexColor();
				availableColors.shift();
			}
			updatedEventColorsMap.set(eventId, color);
		});

		this.eventColors = updatedEventColorsMap;
	};
}
