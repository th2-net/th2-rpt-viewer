/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import {
	action, computed, observable, toJS,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';
import MessagesFilter from '../models/filter/MessagesFilter';
import { prevCyclicItem, nextCyclicItem } from '../helpers/array';
import WindowsStore from './WindowsStore';

export default class MessagesStore {
	filterStore = new FilterStore();

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesCache: Map<string, EventMessage> = new Map();

	@observable
	public isLoading = false;

	@observable
	// eslint-disable-next-line @typescript-eslint/ban-types
	public scrolledIndex: Number | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: string[] = [];

	constructor(private api: ApiSchema, private windowsStore: WindowsStore, messagesStore?: MessagesStore) {
		if (messagesStore) {
			this.copy(messagesStore);
		} else {
			this.loadMessages();
		}
	}

	@computed
	get selectedMessagesIndexes(): Array<number> {
		if (!this.windowsStore.attachedMessagesIds.length && !this.windowsStore.pinnedMessagesIds.length) return [];

		const messagesIndexes = [
			...new Set([
				...this.windowsStore.attachedMessagesIds,
				...this.windowsStore.pinnedMessagesIds]),
		].filter(id => this.messagesIds.includes(id))
			.map(id => this.messagesIds.indexOf(id));

		messagesIndexes.sort((a, b) => a - b);
		return messagesIndexes;
	}

	@action
	loadMessages = async (filter?: MessagesFilter) => {
		this.isLoading = true;
		this.filterStore.setMessagesFilter(filter);
		this.messagesIds = await this.api.messages.getMessagesByFilter(this.filterStore.messagesFilter);
		this.messagesCache = new Map<string, EventMessage>();
		this.isLoading = false;
	};

	@action
	toggleMessageDetailedRaw = (messageId: string) => {
		if (this.detailedRawMessagesIds.includes(messageId)) {
			this.detailedRawMessagesIds = this.detailedRawMessagesIds.filter(id => id !== messageId);
		} else {
			this.detailedRawMessagesIds = [...this.detailedRawMessagesIds, messageId];
		}
	};

	@action
	toggleMessageBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
		} else {
			this.beautifiedMessages = [...this.beautifiedMessages, messageId];
		}
	};

	fetchMessage = async (id: string) => {
		const message = await this.api.messages.getMessage(id);
		if (message) {
			this.messagesCache.set(id, message);
		}
	};

	@action
	selectNextMessage = () => {
		if (!this.selectedMessagesIndexes.length) return;

		if (!this.scrolledIndex || this.selectedMessagesIndexes.indexOf(this.scrolledIndex.valueOf()) === -1) {
			this.scrolledIndex = new Number(this.selectedMessagesIndexes[0]);
			return;
		}
		const nextIndex = nextCyclicItem(this.selectedMessagesIndexes, this.scrolledIndex.valueOf());
		this.scrolledIndex = new Number(nextIndex);
	};

	@action
	selectPrevMessage = () => {
		if (!this.selectedMessagesIndexes.length) return;

		if (!this.scrolledIndex || this.selectedMessagesIndexes.indexOf(this.scrolledIndex.valueOf()) === -1) {
			this.scrolledIndex = new Number(this.selectedMessagesIndexes[this.selectedMessagesIndexes.length - 1]);
			return;
		}
		const prevIndex = prevCyclicItem(this.selectedMessagesIndexes, this.scrolledIndex.valueOf());
		this.scrolledIndex = new Number(prevIndex);
	};

	@action
	toggleBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
			return;
		}
		this.beautifiedMessages = [...this.beautifiedMessages, messageId];
	};

	private copy(store: MessagesStore) {
		this.messagesIds = toJS(store.messagesIds);
		this.messagesCache = observable(store.messagesCache);
		this.beautifiedMessages = observable(store.beautifiedMessages);
		this.detailedRawMessagesIds = observable(store.detailedRawMessagesIds);
		this.isLoading = store.isLoading.valueOf();
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.filterStore = new FilterStore(store.filterStore);
	}
}
