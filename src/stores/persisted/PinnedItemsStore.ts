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

import { action, computed, observable } from 'mobx';
import moment from 'moment';
import { PersistedDataApiSchema } from '../../api/ApiSchema';
import {
	getItemId,
	getItemName,
	isEvent,
	isEventMessage,
	sortByTimestamp,
} from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import {
	PersistedDataCollectionsNames,
	persistedDataLimits,
	PersistedDataTypes,
} from '../../models/PersistedData';
import PersistedStore from './PerstistedStore';

export type BookmarkType = 'event' | 'message';

export type Bookmark = EventBookmark | MessageBookmark;

export interface MessageBookmark {
	timestamp: number;
	id: string;
	item: EventMessage;
}

export interface EventBookmark {
	timestamp: number;
	id: string;
	item: EventMessage | EventTreeNode;
}

export function isBookmark(item: unknown): item is Bookmark {
	return (item as Bookmark).id !== undefined && (item as Bookmark).item !== undefined;
}

export function isEventBookmark(bookmark: unknown): bookmark is EventBookmark {
	return isBookmark(bookmark) && isEvent(bookmark.item);
}

export function isMessageBookmark(bookmark: unknown): bookmark is MessageBookmark {
	return isBookmark(bookmark) && isEventMessage(bookmark.item);
}

export default class extends PersistedStore<
	PersistedDataTypes[PersistedDataCollectionsNames.PINNED_ITEMS]
> {
	constructor(id: string, api: PersistedDataApiSchema) {
		super(id, PersistedDataCollectionsNames.PINNED_ITEMS, api);
	}

	@observable
	public bookmarkType: BookmarkType | null = null;

	@observable
	public textSearch = '';

	@observable
	public selectedPinnedItems: Set<string> = new Set();

	@computed
	public get isLimitReached() {
		return this.data?.length === persistedDataLimits[PersistedDataCollectionsNames.PINNED_ITEMS];
	}

	@computed
	public get savedItems(): Array<EventTreeNode | EventMessage> {
		if (this.data) {
			return sortByTimestamp(this.data.map(pinnedItem => pinnedItem.item));
		}
		return [];
	}

	@computed
	public get filteredPinnedItems() {
		if (this.data) {
			return this.data
				.filter(
					bookmark =>
						this.bookmarkType === null ||
						(this.bookmarkType === 'event' && isEventBookmark(bookmark)) ||
						(this.bookmarkType === 'message' && isMessageBookmark(bookmark)),
				)
				.filter(
					bookmark =>
						getItemId(bookmark.item).includes(this.textSearch) ||
						getItemName(bookmark.item).includes(this.textSearch),
				);
		}
		return [];
	}

	@action
	public setBookmarkType = (type: BookmarkType | null) => {
		this.bookmarkType = type;
	};

	@action
	public setTextSearch = (v: string) => {
		this.textSearch = v;
	};

	@action
	public toggleEventPin = (event: EventTreeNode) => {
		if (!this.data) {
			return;
		}
		const pinned = this.data.find(eventBookmark => eventBookmark.id === event.eventId);
		if (pinned) {
			this.unpinEvent(event.eventId);
		} else {
			this.pinEvent(event);
		}
	};

	@action
	public selectItem = (index: number) => {
		const id = this.filteredPinnedItems[index].id;
		this.selectedPinnedItems.add(id);
	};

	@action
	public selectAll = () => {
		if (this.selectedPinnedItems.size !== this.filteredPinnedItems.length) {
			this.selectedPinnedItems = new Set(this.filteredPinnedItems.map(({ id }) => id));
		} else {
			this.selectedPinnedItems.clear();
		}
	};

	@action
	public removeSelected = () => {
		if (!this.data) {
			return;
		}
		this.data = this.data.filter(({ id }) => !this.selectedPinnedItems.has(id));
		this.selectedPinnedItems.clear();
	};

	@action
	public toggleMessagePin = (message: EventMessage) => {
		if (!this.data) {
			return;
		}
		const pinned = this.data.find(messageBookmark => messageBookmark.id === message.messageId);
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
		if (!this.data) {
			return;
		}

		const hasSame = this.data.some(pinnedEvent => pinnedEvent.id === event.eventId);
		if (hasSame) return;

		const readyToPinEvent = this.createReadyToPinEvent(event);

		if (this.isLimitReached) {
			const newPinnedEvents = this.data.slice(0, -1);
			this.data = [...newPinnedEvents, readyToPinEvent];
			return;
		}

		this.data = [...this.data, readyToPinEvent];
	};

	@action
	private pinMessage = (message: EventMessage) => {
		if (!this.data) {
			return;
		}

		const hasSame = this.data.some(pinnedMessage => pinnedMessage.id === message.messageId);
		if (hasSame) return;

		const readyToPinMessage = this.createReadyToPinMessage(message);

		if (this.isLimitReached) {
			const newPinnedMessages = this.data.slice(0, -1);
			this.data = [...newPinnedMessages, readyToPinMessage];
			return;
		}

		this.data = [...this.data, readyToPinMessage];
	};

	@action
	private unpinEvent = (pinnedEventId: string) => {
		if (!this.data) {
			return;
		}
		this.data = this.data.filter(({ id }) => pinnedEventId !== id);
	};

	@action
	private unpinMessage = (pinnedMessageId: string) => {
		if (!this.data) {
			return;
		}
		this.data = this.data.filter(({ id }) => pinnedMessageId !== id);
	};

	private createReadyToPinMessage = (message: EventMessage): MessageBookmark => {
		return {
			id: message.messageId,
			timestamp: moment.utc().valueOf(),
			item: message,
		};
	};

	private createReadyToPinEvent = (event: EventTreeNode): EventBookmark => {
		return {
			id: event.eventId,
			timestamp: moment.utc().valueOf(),
			item: event,
		};
	};
}
