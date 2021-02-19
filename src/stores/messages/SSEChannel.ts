/* eslint-disable no-underscore-dangle */
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

import { action, observable } from 'mobx';
import api from '../../api';
import { SSEChannelType } from '../../api/ApiSchema';
import { MessagesSSEParams } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import MessagesStore from './MessagesStore';

export class SSEChannel {
	private channel: EventSource | null = null;

	private accumulatedMessages: EventMessage[] = [];

	private chunkSize = 12;

	private updateTimeout = 3500;

	@observable
	public isError = false;

	@observable
	public isLoading = true;

	constructor(
		private messagesStore: MessagesStore,
		private type: SSEChannelType,
		private queryParams: MessagesSSEParams,
		private onResponse: (messages: EventMessage[]) => void,
		private onClose: () => void,
		private onError: (event: Event) => void,
	) {}

	@action
	private _onClose = (event: Event) => {
		this.isLoading = false;
		this.channel?.close();
		if (event instanceof MessageEvent) {
			this.onClose();
		}
	};

	@action
	private _onError = (event: Event) => {
		this.isError = true;
		this.isLoading = false;
		this.channel?.close();
		this.onError(event);
	};

	private onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (isEventMessage(data)) {
			this.accumulatedMessages.push(data);
		}
	};

	messagesResolverInterval: NodeJS.Timeout | null = null;

	messagesResolverTimeout: NodeJS.Timeout | null = null;

	public load = async (): Promise<EventMessage[]> => {
		this.resetSSEState();
		this.isLoading = true;

		let resumeFromId;

		const messages = this.messagesStore.data.messages;
		if (messages.length > 0) {
			resumeFromId =
				this.queryParams.searchDirection === 'next'
					? messages[0].messageId
					: messages[messages.length - 1].messageId;
		}

		this.channel = api.sse.getEventSource({
			queryParams: {
				...this.queryParams,
				resumeFromId,
				resultCountLimit: this.chunkSize,
			},
			type: this.type,
		});

		this.channel.addEventListener('message', this.onSSEResponse);
		this.channel.addEventListener('close', this._onClose);
		this.channel.addEventListener('error', this._onError);

		const messagesChunk = await Promise.race([
			this.resolveMessagesWithinTimeout(this.updateTimeout),
			this.resolveMessagesWithinCount(this.chunkSize),
		]);

		this.resetSSEState();
		this.isLoading = false;

		return messagesChunk;
	};

	resolveMessagesWithinTimeout = (timeout: number): Promise<EventMessage[]> => {
		return new Promise(res => {
			this.messagesResolverTimeout = setTimeout(() => {
				res(this.nextChunk());
			}, timeout);
		});
	};

	resolveMessagesWithinCount = (count: number): Promise<EventMessage[]> => {
		return new Promise(res => {
			this.messagesResolverInterval = setInterval(() => {
				if (this.accumulatedMessages.length >= count) {
					res(this.nextChunk());
				}
			}, 20);
		});
	};

	public stop = () => {
		this.resetSSEState();
	};

	nextChunk = () => {
		let chunk = this.accumulatedMessages;
		if (this.queryParams.searchDirection === 'next') {
			chunk = chunk.reverse();
		}
		return chunk;
	};

	resetSSEState = () => {
		if (this.messagesResolverInterval) {
			clearInterval(this.messagesResolverInterval);
		}

		if (this.messagesResolverTimeout) {
			clearInterval(this.messagesResolverTimeout);
		}

		this.channel?.close();
		this.channel = null;
		this.accumulatedMessages = [];
		this.messagesResolverInterval = null;
		this.messagesResolverTimeout = null;
	};
}
