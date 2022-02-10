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

import { action, computed, observable, reaction, toJS } from 'mobx';
import moment from 'moment';
import {
	Bookmark,
	EventBookmark,
	isEventBookmark,
	isMessageBookmark,
	MessageBookmark,
} from '../../components/bookmarks/BookmarksPanel';
import { sortByTimestamp } from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { UserDataStore } from './UserDataStore';

export default class PinnedItemsStore {
	constructor(private userStore: UserDataStore) {
		reaction(() => this.items, this.userStore.syncPinned);
	}

	@observable
	public events: EventBookmark[] = this.userStore.userPrefs?.pinned.events || [];

	@observable
	public messages: MessageBookmark[] = this.userStore.userPrefs?.pinned.messages || [];

	@computed
	private get items() {
		const items = {
			events: this.events,
			messages: this.messages,
		};
		return items;
	}

	@computed
	public get itemsToShow(): Array<EventMessage | EventTreeNode> {
		return sortByTimestamp([
			...this.events.map(pinnedEvent => pinnedEvent.item),
			...this.messages.map(pinnedMessage => pinnedMessage.item),
		]);
	}

	@action
	public toggleEventPin = async (event: EventTreeNode) => {
		const pinned = this.events.find(eventBookmark => eventBookmark.id === event.eventId);
		if (pinned) {
			this.unpinEvent(event.eventId);
		} else {
			this.pinEvent(event);
		}
	};

	@action
	public toggleMessagePin = (message: EventMessage) => {
		const pinned = this.messages.find(messageBookmark => messageBookmark.id === message.messageId);
		if (pinned) {
			this.unpinMessage(message.messageId);
		} else {
			this.pinMessage(message);
		}
	};

	@action
	public removeBookmark = async (bookmark: Bookmark) => {
		if (isEventBookmark(bookmark)) {
			this.unpinEvent(bookmark.id);
		}

		if (isMessageBookmark(bookmark)) {
			this.unpinMessage(bookmark.id);
		}
	};

	@action
	private pinEvent = (event: EventTreeNode) => {
		const readyToPinEvent = this.createReadyToPinEvent(event);
		const hasSame =
			this.events.findIndex(pinnedEvent => pinnedEvent.id === readyToPinEvent.id) !== -1;
		if (!hasSame) {
			this.events = [...this.events, readyToPinEvent];
		}
	};

	@action
	private pinMessage = (message: EventMessage) => {
		const readyToPinMessage = this.createReadyToPinMessage(message);
		const hasSame =
			this.messages.findIndex(pinnedEvent => pinnedEvent.id === readyToPinMessage.id) !== -1;
		if (!hasSame) {
			this.messages = [...this.messages, readyToPinMessage];
		}
	};

	@action
	private unpinEvent = (pinnedEventId: string) => {
		this.events = this.events.filter(({ id }) => pinnedEventId !== id);
	};

	@action
	private unpinMessage = (pinnedMessageId: string) => {
		this.messages = this.messages.filter(({ id }) => pinnedMessageId !== id);
	};

	private createReadyToPinMessage = (message: EventMessage): MessageBookmark => {
		return {
			id: message.messageId,
			timestamp: moment.utc().valueOf(),
			item: toJS(message),
		};
	};

	private createReadyToPinEvent = (event: EventTreeNode): EventBookmark => {
		return {
			id: event.eventId,
			timestamp: moment.utc().valueOf(),
			item: toJS(event),
		};
	};
}
