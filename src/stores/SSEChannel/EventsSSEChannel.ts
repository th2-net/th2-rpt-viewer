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

import { action } from 'mobx';
import api from '../../api';
import { EventSSEParams, SSEHeartbeat } from '../../api/sse';
import { isEvent } from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import SSEChannel, { SSEChannelOptions, SSEEventListeners } from './SSEChannel';

export type EventSSEEventListeners = SSEEventListeners<EventTreeNode> & {
	onKeepAlive?: (event: SSEHeartbeat) => void;
};

export default class EventSSEChannel extends SSEChannel<EventTreeNode> {
	constructor(
		protected queryParams: EventSSEParams,
		protected eventListeners: EventSSEEventListeners,
		protected options?: SSEChannelOptions,
	) {
		super(isEvent as any, eventListeners, options);
	}

	get eventsFetched() {
		return this.fetchedCount;
	}

	public subscribe(): void {
		this.closeChannel();
		this.resetSSEState({
			isLoading: true,
		});
		this.clearFetchedChunkSubscription();

		this.channel = api.sse.getEventSource({ type: 'event', queryParams: this.queryParams });

		this.channel.addEventListener('event', this.onSSEResponse);
		this.channel.addEventListener('close', this.onClose);
		this.channel.addEventListener('error', this._onError);
		if (this.eventListeners.onKeepAlive) {
			this.channel.addEventListener('keep_alive', this._onKeepAliveResponse);
		}

		this.initUpdateScheduler();
	}

	private _onKeepAliveResponse = (event: Event) => {
		if (this.eventListeners.onKeepAlive) {
			const heatbeat = JSON.parse((event as MessageEvent).data) as SSEHeartbeat;

			if (heatbeat.timestamp !== 0) {
				this.eventListeners.onKeepAlive(heatbeat);
			}
		}
	};

	protected getNextChunk(chunkSize = this.accumulatedData.length): EventTreeNode[] {
		return this.accumulatedData.splice(0, chunkSize);
	}

	@action
	protected onClose = (): void => {
		if (this.fetchedChunkSubscription == null) {
			const chunk = this.getNextChunk();
			if (this.eventListeners.onClose) {
				this.eventListeners.onClose(chunk);
			} else {
				this.eventListeners.onResponse(chunk);
			}
			this.resetSSEState({
				isEndReached: this.fetchedCount !== this.chunkSize,
			});
		}

		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();
	};
}
