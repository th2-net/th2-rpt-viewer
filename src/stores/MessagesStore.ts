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

import { action, observable, reaction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import EventsStore from './EventsStore';
import FilterStore from './FilterStore';
import { EventMessage } from '../models/EventMessage';

export default class MessagesStore {
	private api: ApiSchema;

	private eventsStore: EventsStore;

	private filterStore: FilterStore;

	@observable
	public messagesIds: Array<string> = [];

	@observable
	public messagesCache: Map<string, EventMessage> = new Map();

	@observable
	public isLoading = false;

	constructor(api: ApiSchema, eventsStore: EventsStore, filterStore: FilterStore) {
		this.api = api;
		this.eventsStore = eventsStore;
		this.filterStore = filterStore;

		reaction(
			() => [
				this.filterStore.messagesFromTimestamp,
				this.filterStore.messagesToTimestamp
			],
			([fromTimestamp, toTimestamp]) => {
				this.loadMessagesByTimestamp(
					new Date(fromTimestamp).getTime(),
					new Date(toTimestamp).getTime(),
				);
			},
		);

		reaction(
			() => this.messagesIds,
			() => {
				// clearing messages cache after list has changed
				this.messagesCache = new Map<string, EventMessage>();
			},
		);

		this.loadMessagesByTimestamp(
			new Date(this.filterStore.messagesFromTimestamp).getTime(),
			new Date(this.filterStore.messagesToTimestamp).getTime()
		);
	}

	@action
	loadMessagesByTimestamp = async (from: number, to: number) => {
		this.isLoading = true;
		this.messagesIds = await this.api.messages.getMessagesIds(from, to);
		this.isLoading = false;
	};

	fetchMessage = async (id: string) => {
		const message = await this.api.messages.getMessage(id);
		this.messagesCache.set(id, message!);
	};
}
