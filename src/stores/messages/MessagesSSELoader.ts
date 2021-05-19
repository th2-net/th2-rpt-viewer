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

import { action, observable, when } from 'mobx';
import api from '../../api';
import { SSEChannelType } from '../../api/ApiSchema';
import { MessagesSSEParams, SSEHeartbeat } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { getObjectKeys } from '../../helpers/object';
import { EventMessage } from '../../models/EventMessage';

type WhenPromise = Promise<void> & {
	cancel(): void;
};

type SSEChannelOptions = Partial<{
	chunkSize: number;
	updateSchedulerIntervalMs: number;
	initialResponseTimeoutMs: number;
}>;

export class MessagesSSELoader {
	private channel: EventSource | null = null;

	private accumulatedMessages: EventMessage[] = [];

	private chunkSize = 20;

	private initialResponseTimeout: number | null = null;

	private initialResponseTimeoutMs = 2000;

	private updateScheduler: number | null = null;

	private fetchedChunkSubscription: WhenPromise | null = null;

	private updateSchedulerIntervalMs = 1000;

	private fetchedMessagesCount = 0;

	@observable
	public isError = false;

	@observable
	public isLoading = false;

	@observable isEndReached = false;

	private type: SSEChannelType = 'message';

	constructor(
		private queryParams: MessagesSSEParams,
		private onResponse: (messages: EventMessage[]) => void,
		private onError: (event: Event) => void,
		private onKeepAliveResponse?: (event: SSEHeartbeat) => void,
		options?: SSEChannelOptions,
	) {
		if (options) {
			getObjectKeys(options).forEach(option => {
				const value = options[option];
				if (typeof value === 'number') {
					this[option] = value;
				}
			});
		}
	}

	@action
	private _onClose = () => {
		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();

		if (this.fetchedChunkSubscription == null) {
			const chunk = this.getNextChunk();
			this.onResponse(chunk);
			this.resetSSEState({
				isEndReached: this.fetchedMessagesCount === 0,
			});
		}
	};

	@action
	private _onError = (event: Event) => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();

		this.isError = true;
		this.onError(event);
	};

	@action
	private _onKeepAliveResponse = (event: Event) => {
		if (this.onKeepAliveResponse) {
			const keepAlive = JSON.parse((event as MessageEvent).data) as SSEHeartbeat;

			if (keepAlive.timestamp !== 0) {
				this.onKeepAliveResponse(keepAlive);
			}
		}
	};

	private onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (isEventMessage(data)) {
			this.fetchedMessagesCount += 1;
			this.accumulatedMessages.push(data);
		}
	};

	/*
		Returns a promise within initialResponseTimeoutMs or successfull fetch
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

	public subscribe = (resumeFromId?: string): void => {
		this.initConnection(resumeFromId);
		this.initUpdateScheduler();
	};

	private initConnection = (resumeFromId?: string): void => {
		this.closeChannel();
		this.resetSSEState({ isLoading: true });
		this.clearFetchedChunkSubscription();

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
		this.channel.addEventListener('keep_alive', this._onKeepAliveResponse);
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

	private initUpdateScheduler = (): void => {
		this.updateScheduler = window.setInterval(() => {
			const nextChunk = this.getNextChunk();

			if (nextChunk.length !== 0) {
				this.onResponse(nextChunk);
			}
		}, this.updateSchedulerIntervalMs);
	};

	private getFetchedChunk = async (): Promise<EventMessage[]> => {
		this.fetchedChunkSubscription = when(() => !this.isLoading);
		await this.fetchedChunkSubscription;
		const nextChunk = this.getNextChunk();
		this.resetSSEState();
		return nextChunk;
	};

	public stop = (): void => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();
	};

	private getNextChunk = (chunkSize = this.accumulatedMessages.length): EventMessage[] => {
		let chunk = this.accumulatedMessages.splice(0, chunkSize);

		if (this.queryParams.searchDirection === 'next') {
			chunk = chunk.reverse();
		}
		return chunk;
	};

	private closeChannel = () => {
		this.channel?.close();
		this.channel = null;
	};

	@action
	private resetSSEState = (
		initialState: Partial<{ isLoading: boolean; isError: boolean; isEndReached: boolean }> = {},
	): void => {
		const { isLoading = false, isError = false, isEndReached = false } = initialState;
		this.clearSchedulersAndTimeouts();

		this.accumulatedMessages = [];
		this.isLoading = isLoading;
		this.isError = isError;
		this.isEndReached = isEndReached;
		this.fetchedMessagesCount = 0;
	};

	private clearSchedulersAndTimeouts = (): void => {
		if (this.initialResponseTimeout) {
			window.clearTimeout(this.initialResponseTimeout);
			this.initialResponseTimeout = null;
		}

		if (this.updateScheduler) {
			window.clearInterval(this.updateScheduler);
			this.updateScheduler = null;
		}
	};

	private clearFetchedChunkSubscription = (): void => {
		this.fetchedChunkSubscription?.cancel();
		this.fetchedChunkSubscription = null;
	};
}
