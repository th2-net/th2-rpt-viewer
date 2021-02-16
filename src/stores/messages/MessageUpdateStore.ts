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

import { action, observable, reaction } from 'mobx';
import ApiSchema from '../../api/ApiSchema';
import { EventMessage } from '../../models/EventMessage';
import FilterStore from '../FilterStore';
import MessagesStore from './MessagesStore';

// TODO: fix store
export default class MessageUpdateStore {
	constructor(
		private api: ApiSchema,
		private messagesStore: any,
		private filterStore: FilterStore,
	) {
		reaction(
			() => this.messagesStore.scrollTopMessageId,
			scrollTopMessageId =>
				(this.isAttachedToTop = this.messagesStore.messagesIds[0] === scrollTopMessageId),
		);

		reaction(
			() => this.isAttachedToTop,
			isAttachedToTop => {
				if (isAttachedToTop && this.isSubscriptionActive && this.accumulatedMessages.length) {
					if (this.updateAbortController) {
						this.updateAbortController.abort();
					}
					this.addAccumulatedMessagesToList();
					this.messagesStore.scrollToMessage(this.messagesStore.messagesIds[0]);
				}
			},
		);

		reaction(
			() => this.filterStore.messagesFilter,
			() => this.disableSubscription(),
		);
	}

	@observable
	public isSubscriptionActive = false;

	@observable
	private subscriptionInterval: number | null = null;

	@observable
	public isAttachedToTop = false;

	@observable
	public accumulatedMessages: EventMessage[] = [];

	private updateAbortController: AbortController | null = null;

	@observable
	public toggleSubscribe = () => {
		if (!this.isSubscriptionActive) {
			this.activateSubscription();
		} else {
			this.disableSubscription();
		}
	};

	@action
	public activateSubscription = async () => {
		// Object.keys(this.messagesStore.abortControllers).forEach(key => {
		// 	if (this.messagesStore.abortControllers[key]) {
		// 		this.messagesStore.abortControllers[key]?.abort();
		// 	}
		// });

		if (this.updateAbortController) {
			this.updateAbortController.abort();
		}
		this.updateAbortController = new AbortController();

		if (!this.isAttachedToTop && this.messagesStore.data.isBeginReached) {
			this.messagesStore.scrollToMessage(this.messagesStore.messagesIds[0]);
		}
		this.isSubscriptionActive = true;

		if (!this.messagesStore.data.isBeginReached || this.accumulatedMessages.length) {
			this.messagesStore.messagesIds = [];
			this.messagesStore.messagesCache.clear();
			this.accumulatedMessages = [];
			this.messagesStore.data.isBeginReached = true;
			this.messagesStore.messagesLoadingState.loadingRootItems = true;

			const messages = await this.api.messages.getMessages(
				{
					limit: this.messagesStore.MESSAGES_CHUNK_SIZE,
					timelineDirection: 'previous',
					idsOnly: false,
					messageId: '',
				},
				{
					timestampTo: Date.now(),
					timestampFrom: null,
					streams: this.filterStore.messagesFilter.streams,
					messageTypes: this.filterStore.messagesFilter.messageTypes,
				},
				this.updateAbortController.signal,
			);

			this.messagesStore.messagesLoadingState.loadingRootItems = false;
			this.messagesStore.addMessagesToList(messages, 'next');
		}
		this.isAttachedToTop = true;

		const checkUpdates = async () => {
			this.updateAbortController = new AbortController();
			if (this.isAttachedToTop) {
				// const messagesIds = await this.messagesStore.getMessages(
				// 	'next',
				// 	this.messagesStore.messagesIds[0],
				// 	this.messagesStore.MESSAGES_CHUNK_SIZE,
				// 	true,
				// 	this.updateAbortController.signal,
				// );
				// if (messagesIds?.length && this.isAttachedToTop) {
				// 	this.messagesStore.scrollToMessage(messagesIds[0]);
				// }
			} else {
				const messages = await this.api.messages.getMessages(
					{
						messageId: this.accumulatedMessages.length
							? this.accumulatedMessages[0].messageId
							: this.messagesStore.messagesIds[0],
						idsOnly: false,
						timelineDirection: 'next',
						limit: this.messagesStore.MESSAGES_CHUNK_SIZE,
					},
					this.filterStore.messagesFilter,
					this.updateAbortController.signal,
				);

				if (!this.isAttachedToTop) {
					this.accumulatedMessages = [...messages, ...this.accumulatedMessages];
				}
			}
		};

		const check = async () => {
			await checkUpdates();
			if (this.accumulatedMessages.length < 200 && this.isSubscriptionActive) {
				this.subscriptionInterval = window.setTimeout(() => check(), 1000);
			} else {
				this.isSubscriptionActive = false;
			}
		};

		if (this.subscriptionInterval) {
			window.clearInterval(this.subscriptionInterval);
		}
		this.subscriptionInterval = window.setTimeout(check, 1000);
	};

	@action
	public disableSubscription = () => {
		if (this.accumulatedMessages.length && !this.isAttachedToTop) {
			this.addAccumulatedMessagesToList();
			this.messagesStore.scrollToMessage(this.messagesStore.messagesIds[0]);
			this.isAttachedToTop = true;

			return;
		}

		this.isSubscriptionActive = false;
		// this.messagesStore.abortControllers.nextAC?.abort();
		if (this.subscriptionInterval) {
			window.clearInterval(this.subscriptionInterval);
		}
	};

	@action
	public addAccumulatedMessagesToList = () => {
		if (!this.accumulatedMessages.length) return;

		this.messagesStore.addMessagesToList(this.accumulatedMessages, 'next');
		this.accumulatedMessages = [];
	};
}
