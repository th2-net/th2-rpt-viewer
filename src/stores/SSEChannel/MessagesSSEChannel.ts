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

import { action, when } from 'mobx';
import api from '../../api';
import { SSEChannelType } from '../../api/ApiSchema';
import { MessagesSSEParams, SSEHeartbeat, MessagesIdsEvent } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import SSEChannel, { SSEChannelOptions, SSEEventListeners } from './SSEChannel';

type MessageSSEEventListeners = SSEEventListeners<EventMessage> & {
	onKeepAliveResponse?: (event: SSEHeartbeat) => void;
};

export class MessagesSSEChannel extends SSEChannel<EventMessage> {
	private readonly type: SSEChannelType = 'message';

	private readonly initialResponseTimeoutMs = 2000;

	private messagesIdsEvent: MessagesIdsEvent | null = null;

	constructor(
		private queryParams: MessagesSSEParams,
		protected eventListeners: MessageSSEEventListeners,
		protected options?: SSEChannelOptions,
	) {
		super(isEventMessage, eventListeners, options);
	}

	public subscribe = (resumeFromId?: string): void => {
		this.initConnection(resumeFromId);
		this.initUpdateScheduler();
	};

	protected getNextChunk = (chunkSize = this.accumulatedData.length): EventMessage[] => {
		let chunk = this.accumulatedData.splice(0, chunkSize);

		if (this.queryParams.searchDirection === 'next') {
			chunk = chunk.reverse();
		}
		return chunk;
	};

	@action
	protected onClose = () => {
		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();

		const isEndReached = this.messagesIdsEvent
			? Object.values(this.messagesIdsEvent.messageIds).every(messageId => messageId === null)
			: false;

		if (this.fetchedChunkSubscription == null) {
			const chunk = this.getNextChunk();
			this.eventListeners.onResponse(chunk);
			this.resetSSEState({ isEndReached });
		} else {
			this.isEndReached = isEndReached;
		}
	};

	@action
	private _onKeepAliveResponse = (event: Event) => {
		if (this.eventListeners.onKeepAliveResponse) {
			const keepAlive = JSON.parse((event as MessageEvent).data) as SSEHeartbeat;

			if (keepAlive.timestamp !== 0) {
				this.eventListeners.onKeepAliveResponse(keepAlive);
			}
		}
	};

	/*
		Returns a promise within initialResponseTimeoutMs or successful fetch
		and subscribes on changes 
	*/
	public loadAndSubscribe = async (resumeFromId?: string): Promise<EventMessage[]> => {
		this.initConnection(resumeFromId);

		const messagesChunk = await Promise.race([
			this.getInitialResponseWithinTimeout(this.initialResponseTimeoutMs),
			this.getFetchedChunk(),
		]);

		return messagesChunk;
	};

	private initConnection = (resumeFromId?: string): void => {
		this.closeChannel();
		this.resetSSEState({ isLoading: true });
		this.clearFetchedChunkSubscription();

		const messageId: string[] = this.messagesIdsEvent
			? (Object.values(this.messagesIdsEvent.messageIds).filter(Boolean) as string[])
			: [];

		this.messagesIdsEvent = null;
		this.channel = api.sse.getEventSource({
			queryParams: {
				...this.queryParams,
				resumeFromId:
					(messageId.length ? undefined : resumeFromId) ?? this.queryParams.resumeFromId,
				...(this.queryParams.keepOpen
					? {
							resultCountLimit: undefined,
					  }
					: {
							resultCountLimit: this.chunkSize,
					  }),
				messageId,
			},
			type: this.type,
		});

		this.channel.addEventListener('message', this.onSSEResponse);
		this.channel.addEventListener('close', this.onClose);
		this.channel.addEventListener('error', this._onError);
		this.channel.addEventListener('keep_alive', this._onKeepAliveResponse);
		this.channel.addEventListener('message_ids', this.onMessageIdsEvent);
	};

	private getInitialResponseWithinTimeout = (timeout: number): Promise<EventMessage[]> => {
		return new Promise(res => {
			this.initialResponseTimeout = window.setTimeout(() => {
				res(this.getNextChunk());
				this.clearFetchedChunkSubscription();
				this.initUpdateScheduler();
			}, timeout);
		});
	};

	private getFetchedChunk = async (): Promise<EventMessage[]> => {
		this.fetchedChunkSubscription = when(() => !this.isLoading);
		await this.fetchedChunkSubscription;
		const nextChunk = this.getNextChunk();
		this.resetSSEState({ isEndReached: this.isEndReached });
		return nextChunk;
	};

	private onMessageIdsEvent = (e: Event) => {
		this.messagesIdsEvent = e instanceof MessageEvent && e.data ? JSON.parse(e.data) : null;
	};
}
