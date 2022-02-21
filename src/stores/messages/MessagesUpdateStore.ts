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
import notificationsStore from '../NotificationsStore';
import { MessagesSSEChannel } from '../SSEChannel/MessagesSSEChannel';
import MessagesStore from './MessagesStore';
import EmbeddedMessagesStore from '../../components/embedded/embedded-stores/EmbeddedMessagesStore';
import { MessagesDataStore } from '../../models/Stores';

export default class MessagesUpdateStore {
	constructor(
		private messagesDataStore: MessagesDataStore,
		private messagesStore: MessagesStore | EmbeddedMessagesStore,
	) {}

	@observable
	private channel: MessagesSSEChannel | null = null;

	@action
	public subscribeOnChanges = async () => {
		// For some reason MessagesUpdateStore doesn't react on
		// filter changes in MessagesFilterStore
		const queryParams = this.messagesDataStore.getFilterParams();

		const { onNextChannelResponse, resumeMessageIdsNext } = this.messagesDataStore;

		this.channel = new MessagesSSEChannel(
			{
				...queryParams,
				searchDirection: 'next',
				keepOpen: true,
				messageId: resumeMessageIdsNext.idList,
				resultCountLimit: undefined,
			},
			{
				onResponse: incomingMessages => {
					if (incomingMessages.length) {
						onNextChannelResponse(incomingMessages);
						const id = incomingMessages[0].messageId;
						if (id) this.messagesStore.selectedMessageId = new String(id);
					}
				},
				onError: this.onLoadingError,
			},
		);

		this.channel.subscribe(resumeMessageIdsNext.idList);
	};

	private onLoadingError = (event: Event) => {
		notificationsStore.handleSSEError(event);
		this.stopSubscription();
	};

	public stopSubscription = () => {
		this.channel?.stop();
	};

	@computed
	public get isLoading() {
		return this.channel?.isLoading ?? false;
	}
}
