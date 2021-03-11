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
import { MessagesSSEParams } from '../../api/sse';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';

type WhenPromise = Promise<void> & {
	cancel(): void;
};

export class SSEChannel {
	private channel: EventSource | null = null;

	private accumulatedMessages: EventMessage[] = [];

	private chunkSize = 12;

	private initialResponseTimeout: number | null = null;

	private initialResponseTimeoutMs = 2000;

	private updateScheduler: number | null = null;

	private fetchedChunkSubscription: WhenPromise | null = null;

	private updateSchedulerIntervalMs = 1000;

	@observable
	public isError = false;

	@observable
	public isLoading = false;

	constructor(
		private type: SSEChannelType,
		private queryParams: MessagesSSEParams,
		private onResponse: (messages: EventMessage[]) => void,
		private onError: (event: Event) => void,
		chunkSize?: number,
	) {
		if (chunkSize) this.chunkSize = chunkSize;
	}

	@action
	private _onClose = () => {
		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();

		if (this.fetchedChunkSubscription == null) {
			this.onResponse(this.getNextChunk());
			this.resetSSEState();
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

	private onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (isEventMessage(data)) {
			this.accumulatedMessages.push(data);
		}
	};

	public load = async (resumeFromId?: string): Promise<EventMessage[]> => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();

		this.isLoading = true;

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
			this.getInitialResponseWithinTimeout(this.initialResponseTimeoutMs),
			this.getFetchedChunk(),
		]);

		return messagesChunk;
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
	private resetSSEState = (): void => {
		this.clearSchedulersAndTimeouts();

		this.accumulatedMessages = [];
		this.isLoading = false;
		this.isError = false;
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
