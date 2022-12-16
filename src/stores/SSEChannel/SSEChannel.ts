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
import { getObjectKeys } from '../../helpers/object';

export interface ISSEChannel {
	subscribe: () => void;
	stop: () => void;
	isError: boolean;
	isLoading: boolean;
	isEndReached: boolean;
}

type WhenPromise = Promise<void> & {
	cancel(): void;
};

export interface SSEEventListeners<T> {
	onResponse: (events: T[]) => void;
	onClose?: (events: T[]) => void;
	onError: (event: Event) => void;
}

export type SSEChannelOptions = Partial<{
	chunkSize: number;
	updateSchedulerIntervalMs: number;
}>;

export default abstract class SSEChannel<T> implements ISSEChannel {
	protected channel: EventSource | null = null;

	protected accumulatedData: T[] = [];

	protected chunkSize = 20;

	protected initialResponseTimeout: number | null = null;

	private updateScheduler: number | null = null;

	protected fetchedChunkSubscription: WhenPromise | null = null;

	private updateSchedulerIntervalMs = 1000;

	protected fetchedCount = 0;

	@observable
	public isError = false;

	@observable
	public isLoading = false;

	@observable
	public isEndReached = false;

	constructor(
		protected typeGuard: (data: unknown) => data is T,
		protected eventListeners: SSEEventListeners<T>,
		protected options?: SSEChannelOptions,
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

	public abstract subscribe(): void;

	protected abstract getNextChunk(chunkSize?: number): T[];

	protected abstract onClose(): void;

	protected onSSEResponse = (ev: Event) => {
		const data = JSON.parse((ev as MessageEvent).data);
		if (this.typeGuard(data)) {
			this.fetchedCount += 1;
			this.accumulatedData.push(data);
		}
	};

	@action
	protected _onError = (event: Event) => {
		this.closeChannel();
		this.resetSSEState();
		this.clearFetchedChunkSubscription();

		this.isError = true;
		this.eventListeners.onError(event);
	};

	@action
	protected resetSSEState = (
		initialState: Partial<{ isLoading: boolean; isError: boolean; isEndReached: boolean }> = {},
	): void => {
		const { isLoading = false, isError = false, isEndReached = false } = initialState;
		this.clearSchedulersAndTimeouts();
		this.accumulatedData = [];
		this.isLoading = isLoading;
		this.isError = isError;
		this.isEndReached = isEndReached;
		this.fetchedCount = 0;
	};

	protected initUpdateScheduler = (): void => {
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

	protected closeChannel = () => {
		this.channel?.close();
		this.channel = null;
	};

	protected clearSchedulersAndTimeouts = (): void => {
		if (this.initialResponseTimeout) {
			window.clearTimeout(this.initialResponseTimeout);
			this.initialResponseTimeout = null;
		}

		if (this.updateScheduler) {
			window.clearInterval(this.updateScheduler);
			this.updateScheduler = null;
		}
	};

	protected clearFetchedChunkSubscription = (): void => {
		this.fetchedChunkSubscription?.cancel();
		this.fetchedChunkSubscription = null;
	};
}
