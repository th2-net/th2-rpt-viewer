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

import { action, toJS, when } from 'mobx';
import moment from 'moment';
import api from '../../api';
import { SSEChannelType } from '../../api/ApiSchema';
import { MessagesSSEParams, SSEHeartbeat, MessageIdsEvent } from '../../api/sse';
import { getArrayOfUniques } from '../../helpers/array';
import { isEventMessage } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import SSEChannel, { SSEChannelOptions, SSEEventListeners } from './SSEChannel';

export type MessageSSEEventListeners = SSEEventListeners<EventMessage> & {
	onKeepAliveResponse?: (event: SSEHeartbeat) => void;
	onMessageIdsEvent?: (event: MessageIdsEvent) => void;
};

export class MessagesSSEChannel extends SSEChannel<EventMessage> {
	private readonly type: SSEChannelType = 'message';

	private messageIds: string[] = [];

	constructor(
		private queryParams: MessagesSSEParams,
		protected eventListeners: MessageSSEEventListeners,
		protected options?: SSEChannelOptions,
	) {
		super(isEventMessage, eventListeners, options);
	}

	public subscribe = (resumeMessageIds?: string[]): void => {
		this.messageIds = resumeMessageIds || this.messageIds;
		this.initConnection(resumeMessageIds);
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
		const isEndReached = this.fetchedCount === 0;

		if (this.fetchedChunkSubscription == null || this.eventListeners.onClose) {
			const chunk = this.getNextChunk();
			(this.eventListeners.onClose || this.eventListeners.onResponse)(chunk);
			console.log('onClose');
			this.resetSSEState({ isEndReached });
		} else {
			this.isEndReached = isEndReached;
		}

		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();
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
	public loadAndSubscribe = async (options?: {
		resumeMessageIds?: string[];
		initialResponseTimeoutMs?: number | null;
	}): Promise<EventMessage[]> => {
		const { resumeMessageIds, initialResponseTimeoutMs = 2000 } = options || {};
		this.initConnection(resumeMessageIds);

		try {
			const messagesChunk = await (initialResponseTimeoutMs
				? Promise.race([
						this.getInitialResponseWithinTimeout(initialResponseTimeoutMs),
						this.getFetchedChunk(),
				  ])
				: this.getFetchedChunk());
			console.log(messagesChunk.map(val => toJS(val)));
			return messagesChunk;
		} catch (error) {
			console.log(error);
			if (error !== 'WHEN_CANCELLED') {
				console.log(error);
			}
			return [];
		}
	};

	private initConnection = (resumeMessageIds?: string[]): void => {
		console.log('initConnection');
		this.closeChannel();
		this.resetSSEState({ isLoading: true });
		this.clearFetchedChunkSubscription();
		this.messageIds = resumeMessageIds || this.messageIds;

		this.channel = api.sse.getEventSource({
			queryParams: {
				...this.queryParams,
				messageId: this.messageIds,
			},
			type: this.type,
		});

		this.channel.addEventListener('message', this.onSSEResponse);
		this.channel.addEventListener('close', this.onClose);
		this.channel.addEventListener('error', this._onError);
		this.channel.addEventListener('keep_alive', this._onKeepAliveResponse);
		this.channel.addEventListener('message_ids', this._onMessageIdsEvent);
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

	private _onMessageIdsEvent = (e: Event) => {
		const messagesIdsEvent: MessageIdsEvent =
			e instanceof MessageEvent && e.data ? JSON.parse(e.data) : null;
		const streams = getArrayOfUniques(
			this.messageIds
				.filter(id => id.slice(id.lastIndexOf(':') + 1) === '-1')
				.map(id => id.slice(0, id.indexOf(':'))),
		);
		if (streams.length > 0) {
			api.messages
				.getResumptionMessageIds({
					streams,
					startTimestamp: moment().utc().valueOf(),
				})
				.then(streamInfo => {
					this.messageIds = [
						...this.messageIds.filter(id => !streams.find(stream => id.includes(stream))),
						...(this.queryParams.searchDirection === 'next'
							? streamInfo.next.map(info => info.lastElement)
							: streamInfo.previous.map(info => info.lastElement)),
					];
				});
		}
		this.messageIds = Object.values(messagesIdsEvent.messageIds).filter(Boolean) as string[];
		if (messagesIdsEvent && this.eventListeners.onMessageIdsEvent) {
			this.eventListeners.onMessageIdsEvent(messagesIdsEvent);
		}
	};

	public refetch(eventListeners?: MessageSSEEventListeners) {
		this.eventListeners = eventListeners || this.eventListeners;
		this.subscribe();
	}
}
