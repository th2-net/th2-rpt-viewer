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

import { action, IReactionDisposer, observable } from 'mobx';
import throttle from 'lodash.throttle';
import api from '../../api';
import { SSEChannelType } from '../../api/ApiSchema';
import { MessagesSSEParams } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import MessagesStore from './MessagesStore';

export class SSEChannel {
	private channel: EventSource | null = null;

	@observable.ref
	private accumulatedMessages: EventMessage[] = [];

	private immdediateMessageResponse = 15;

	private sentMessages = 0;

	private chunkUpdateSize = 15;

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
		if (event instanceof MessageEvent) {
			this.onError(event);
		}
	};

	private onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (isEventMessage(data)) {
			this.accumulatedMessages = [...this.accumulatedMessages, data];
		}
	};

	public load = (): Promise<EventMessage[]> => {
		let resumeFromId;
		this.isLoading = true;
		if (this.messagesStore.data.messages.length > 0) {
			resumeFromId =
				this.queryParams.searchDirection === 'next'
					? this.messagesStore.data.messages[0].messageId
					: this.messagesStore.data.messages[this.messagesStore.data.messages.length - 1].messageId;
		}
		this.channel = api.sse.getEventSource({
			queryParams: {
				...this.queryParams,
				resumeFromId,
				resultCountLimit: 15,
			},
			type: this.type,
		});
		this.channel.addEventListener('message', this.onSSEResponse);
		this.channel.addEventListener('close', this._onClose);
		this.channel.addEventListener('error', this._onError);

		return new Promise(res => {
			setTimeout(() => {
				res(
					this.queryParams.searchDirection === 'next'
						? this.accumulatedMessages.reverse()
						: this.accumulatedMessages,
				);
				this.accumulatedMessages = [];
				this.isLoading = false;
			}, 2000);
		});
	};

	public stop = () => {
		this.channel?.close();
		// this.channel = null;
	};

	nextChunk = async (): Promise<EventMessage[]> => {
		let chunk = this.accumulatedMessages.splice(0, this.chunkUpdateSize);
		if (this.queryParams.searchDirection === 'next') {
			chunk = chunk.reverse();
		}
		this.sentMessages += chunk.length;
		return chunk;
	};
}
