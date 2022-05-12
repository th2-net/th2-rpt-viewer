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
import moment from 'moment';
import api from '../../api';
import { SSEParamsEvents } from '../../api/sse';
import { isEventNode } from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import EventsFilter from '../../models/filter/EventsFilter';
import { TimeRange } from '../../models/Timestamp';
import SSEChannel, { SSEChannelOptions, SSEEventListeners } from './SSEChannel';

export default class EventSSEChannel extends SSEChannel<EventTreeNode> {
	constructor(
		protected searchParams: {
			timeRange: TimeRange;
			filter: EventsFilter | null;
			sseParams: SSEParamsEvents;
		},
		protected eventListeners: SSEEventListeners<EventTreeNode>,
		protected options?: SSEChannelOptions,
	) {
		super(isEventNode, eventListeners, options);
	}

	public subscribe(): void {
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
		this.channel.addEventListener('close', this.onClose);
		this.channel.addEventListener('error', this._onError);

		this.initUpdateScheduler();
	}

	protected getNextChunk(chunkSize = this.accumulatedData.length): EventTreeNode[] {
		return this.accumulatedData.splice(0, chunkSize).map(eventData => {
			return {
				...eventData,
				startTimestamp: moment(eventData.startTimestamp).valueOf(),
				endTimestamp: eventData.endTimestamp
					? moment(eventData.endTimestamp).valueOf()
					: eventData.endTimestamp,
			};
		});
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
				isEndReached: this.fetchedEventsCount !== this.chunkSize,
			});
		}

		this.closeChannel();
		this.isLoading = false;
		this.clearSchedulersAndTimeouts();
	};
}
