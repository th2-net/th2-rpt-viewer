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

import { action, computed, observable, runInAction } from 'mobx';
import MessagesStore from './MessagesStore';
import EmbeddedMessagesStore from '../../components/embedded/embedded-stores/EmbeddedMessagesStore';
import { MessagesDataStore } from '../../models/Stores';

export default class MessagesUpdateStore {
	constructor(
		private messagesDataStore: MessagesDataStore,
		private messagesStore: MessagesStore | EmbeddedMessagesStore,
	) {}

	@observable
	private timer: ReturnType<typeof setTimeout> | null = null;

	@action
	public subscribeOnChanges = () => {
		this.startLoop();
	};

	@action
	startLoop = async () => {
		const { getNextMessages, onNextChannelResponse } = this.messagesDataStore;

		const messages = await getNextMessages();

		if (messages.length) {
			onNextChannelResponse(messages);
			this.messagesStore.selectedMessageId = messages[0].id;
		}

		runInAction(() => (this.timer = setTimeout(this.startLoop, 5000)));
	};

	@action
	public stopSubscription = () => {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	};

	@computed
	public get isLoading() {
		return !!this.timer;
	}
}
