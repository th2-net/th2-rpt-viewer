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
import MessagesStore from './MessagesStore';
import EmbeddedMessagesStore from '../../components/embedded/embedded-stores/EmbeddedMessagesStore';
import { MessagesDataStore } from '../../models/Stores';
import { EventMessage } from '../../models/EventMessage';

export default class MessagesUpdateStore {
	constructor(
		private messagesDataStore: MessagesDataStore,
		private messagesStore: MessagesStore | EmbeddedMessagesStore,
	) {}

	private timer: ReturnType<typeof setTimeout> | null = null;

	@observable
	public isActive = false;

	@observable
	public isFirstUpdate = true;

	@observable
	public nextMessages: EventMessage[] = [];

	@computed
	public get canActivate() {
		return this.messagesStore.filterStore.filter.streams.length > 0;
	}

	@action
	public subscribeOnChanges = async () => {
		if (!this.canActivate) return;
		this.isActive = true;
		this.isFirstUpdate = true;
		this.messagesDataStore.resetState();
		this.messagesStore.selectedMessageId = null;
		this.messagesStore.filterStore.filter.timestampTo = Date.now();

		this.messagesDataStore.loadMessages({
			onClose: async () => {
				if (this.isActive) {
					this.timer = setTimeout(this.loadNextMessages, 5000);
				}
			},
		});
	};

	@action
	public stopSubscription = () => {
		if (this.timer) {
			clearTimeout(this.timer);
		}
		this.isActive = false;
	};

	private loadNextMessages = async () => {
		this.nextMessages = await this.messagesDataStore.getNextMessages();

		if (this.nextMessages.length > 0 || this.isFirstUpdate) {
			const prevMessages = await this.messagesDataStore.getPreviousMessages();

			this.messagesDataStore.onNextChannelResponse(this.nextMessages, true);
			this.messagesDataStore.onPrevChannelResponse(prevMessages);

			if (this.isFirstUpdate) {
				this.isFirstUpdate = false;
			}
		}
	};
}
