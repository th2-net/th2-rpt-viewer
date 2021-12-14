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
import { MessagesDataStore } from '../../models/Stores';
import { MessagesSSEChannel } from '../SSEChannel/MessagesSSEChannel';

export default class MessagesUpdateStore {
	constructor(
		private messagesDataStore: MessagesDataStore,
		private scrollToMessage: (messageId: string) => void,
	) {}

	@observable
	private channel: MessagesSSEChannel | null = null;

	@action
	public subscribeOnChanges = async () => {
		// For some reason MessagesUpdateStore doesn't react on
		// filter changes in MessagesFilterStore
		const queryParams = await this.messagesDataStore.getFilterParams();

		const { onNextChannelResponse, messages } = this.messagesDataStore;

		this.channel = new MessagesSSEChannel(
			{
				...queryParams,
				searchDirection: 'next',
				keepOpen: true,
				...(messages[0]?.messageId
					? {
							resumeFromId: messages[0].messageId,
							startTimestamp: undefined,
					  }
					: {}),
				resultCountLimit: undefined,
			},
			{
				onResponse: incommingMessages => {
					if (incommingMessages.length) {
						onNextChannelResponse(incommingMessages);
						this.scrollToMessage(incommingMessages[0].messageId);
					}
				},
				onError: this.onLoadingError,
			},
		);

		this.channel.subscribe(messages[0]?.messageId);
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
