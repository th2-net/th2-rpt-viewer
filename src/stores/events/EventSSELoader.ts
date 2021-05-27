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
import { SSEParamsEvents } from '../../api/sse';
import { isEventNode } from '../../helpers/event';
import { getObjectKeys } from '../../helpers/object';
import { EventTreeNode } from '../../models/EventAction';
import EventsFilter from '../../models/filter/EventsFilter';
import { TimeRange } from '../../models/Timestamp';

type WhenPromise = Promise<void> & {
	cancel(): void;
};

type SSEChannelOptions = Partial<{
	chunkSize: number;
	updateSchedulerIntervalMs: number;
}>;

interface SSEEventListeners {
	onResponse: (events: EventTreeNode[]) => void;
	onClose?: (events: EventTreeNode[]) => void;
	onError: (event: Event) => void;
}

export class EventSSELoader {
	private channel: EventSource | null = null;

	private accumulatedEvents: EventTreeNode[] = [];

	private chunkSize = 10;

	private initialResponseTimeout: number | null = null;

	private updateScheduler: number | null = null;

	private fetchedChunkSubscription: WhenPromise | null = null;

	private updateSchedulerIntervalMs = 1000;

	private fetchedEventsCount = 0;

	@observable
	public isError = false;

	@observable
	public isLoading = false;

	@observable
	public isEndReached = false;

	constructor(
		private searchParams: {
			timeRange: TimeRange;
			filter: EventsFilter | null;
			sseParams: SSEParamsEvents;
		},
		private eventListeners: SSEEventListeners,
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
			if (this.eventListeners.onClose) {
				this.eventListeners.onClose(chunk);
			} else {
				this.eventListeners.onResponse(chunk);
			}
			this.resetSSEState({
				isEndReached: this.fetchedEventsCount !== this.chunkSize,
			});
		}
	};

	@action
	private _onError = (event: Event) => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();

		this.isError = true;
		this.eventListeners.onError(event);
	};

	private onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (isEventNode(data)) {
			this.fetchedEventsCount += 1;
			this.accumulatedEvents.push(data);
		}
	};

	public subscribe = (): void => {
		this.closeChannel();
		this.resetSSEState({
			isLoading: true,
		});
		this.clearFetchedChunkSubscription();

		this.channel = api.sse.getEventsTreeSource(
			this.searchParams.timeRange,
			this.searchParams.filter,
			this.searchParams.sseParams,
		);

		this.channel.addEventListener('event', this.onSSEResponse);
		this.channel.addEventListener('close', this._onClose);
		this.channel.addEventListener('error', this._onError);

		this.initUpdateScheduler();
	};

	private initUpdateScheduler = (): void => {
		this.updateScheduler = window.setInterval(() => {
			const nextChunk = this.getNextChunk();

			if (nextChunk.length !== 0) {
				this.eventListeners.onResponse(nextChunk);
			}
		}, this.updateSchedulerIntervalMs);
	};

	public stop = (): void => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();
	};

	private getNextChunk = (chunkSize = this.accumulatedEvents.length): EventTreeNode[] => {
		return this.accumulatedEvents.splice(0, chunkSize);
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

		this.accumulatedEvents = [];
		this.isLoading = isLoading;
		this.isError = isError;
		this.isEndReached = isEndReached;
		this.fetchedEventsCount = 0;
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
