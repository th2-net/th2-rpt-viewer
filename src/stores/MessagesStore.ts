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
	action,
	observable,
	reaction,
	computed,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';
import MessagesFilter from '../models/filter/MessagesFilter';
import { prevCyclicItem, nextCyclicItem } from '../helpers/array';

export default class MessagesStore {
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
	public pinnedMessagesIds: Array<string> = [];

	@observable
	public attachedMessagesIds: Array<string> = [];

	constructor(
		private api: ApiSchema,
		private filterStore: FilterStore,
	) {
		reaction(
			() => this.filterStore.messagesFilter,
			filter => this.loadMessagesByFilter(filter),
		);

		reaction(
			() => this.messagesIds,
			() => {
				// clearing messagesFilter cache after list has changed
				this.messagesCache = new Map<string, EventMessage>();
			},
		);

		this.loadMessagesByFilter(filterStore.messagesFilter);
	}

	@computed
	get selectedMessagesIds(): Array<number> {
		if (!this.attachedMessagesIds.length && !this.pinnedMessagesIds.length) return [];

		const messagesIndexes = [...new Set([...this.attachedMessagesIds, ...this.pinnedMessagesIds])]
			.filter(id => this.messagesIds.includes(id))
			.map(id => this.messagesIds.indexOf(id));

		messagesIndexes.sort((a, b) => a - b);
		return messagesIndexes;
	}

	@action
	loadMessagesByFilter = async (filter: MessagesFilter) => {
		this.isLoading = true;
		this.messagesIds = await this.api.messages.getMessagesByFilter(filter);
		this.isLoading = false;
	};

	@action
	toggleMessagePin = (message: EventMessage) => {
		const { messageId } = message;
		if (!this.pinnedMessagesIds.includes(messageId)) {
			this.pinnedMessagesIds = this.pinnedMessagesIds.concat(messageId);
		} else {
			this.pinnedMessagesIds = this.pinnedMessagesIds.filter(
				id => id !== messageId,
			);
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
		if (!this.selectedMessagesIds.length) return;

		if (!this.scrolledIndex || this.selectedMessagesIds.indexOf(this.scrolledIndex.valueOf()) === -1) {
			this.scrolledIndex = new Number(this.selectedMessagesIds[0]);
			return;
		}
		const nextIndex = nextCyclicItem(this.selectedMessagesIds, this.scrolledIndex.valueOf());
		this.scrolledIndex = new Number(nextIndex);
	};

	@action
	selectPrevMessage = () => {
		if (!this.selectedMessagesIds.length) return;

		if (!this.scrolledIndex || this.selectedMessagesIds.indexOf(this.scrolledIndex.valueOf()) === -1) {
			this.scrolledIndex = new Number(this.selectedMessagesIds[this.selectedMessagesIds.length - 1]);
			return;
		}
		const prevIndex = prevCyclicItem(this.selectedMessagesIds, this.scrolledIndex.valueOf());
		this.scrolledIndex = new Number(prevIndex);
	};
}
