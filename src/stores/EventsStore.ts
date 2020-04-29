/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import { action, computed, observable, reaction } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';
import FilterStore from './FilterStore';
import { getTimestampAsNumber } from '../helpers/date';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable indent */
export default class EventsStore {
	subNodesAbortController: undefined | null | AbortController;

	constructor(
		private api: ApiSchema,
		private filterStore: FilterStore,
	) {
		reaction(
			() => this.eventsList,
			this.onEventsListChange,
		);
	}

	@observable eventsList: Array<[string | null, EventAction[] | EventAction]> = [[null, []]];

	@observable selectedRootEvent: EventAction | null = null;

	@observable loadingEventId: null | string = null;

	@action
	getEvents = async () => {
		try {
			const events = await this.api.events.getAll();
			events.sort((a, b) => b.startTimestamp.epochSecond - a.startTimestamp.epochSecond);
			this.eventsList = [[null, events]];
		} catch (error) {
			console.error('Error while loading events', error);
		}
	};

	@action
	getEventSubNodes = async (event: EventAction) => {
		this.loadingEventId = event.eventId;
		this.subNodesAbortController?.abort();
		this.subNodesAbortController = new AbortController();
		try {
			const children = await this.api.events.getSubNodes(event.eventId, this.subNodesAbortController.signal);
			this.subNodesAbortController = null;
			this.loadingEventId = null;
			if (children.length === 0) return;
			if (event.parentEventId !== null) {
				// this.eventsList = [...this.eventsList.slice(0, parentIndex + 1), [event.eventId, children]];
				this.eventsList.push([event.eventId, children]);
				return;
			}
			this.eventsList = [this.eventsList[0], [event.eventId, children]];
			return;
		} catch (error) {
			console.error('Error while loading event children', error);
		}
	};

	@action
	selectEvent = (event: EventAction, listIndex: number) => {
		this.eventsList = this.eventsList.slice(0, listIndex + 1);
		if (event.parentEventId !== null
			&& this.eventsList.findIndex(([parentId]) => parentId === event.eventId) === -1) {
			this.eventsList.push([event.eventId, event]);
			return;
		}
		if (event.parentEventId === null) {
			if (this.selectedRootEvent && this.selectedRootEvent.eventId === event.eventId) return;
			this.selectedRootEvent = event;
		}
		this.getEventSubNodes(event);
	};

	@action
	selectNextEvent = () => {
		if (!this.selectedRootEvent) return;
		const nextEvent = nextCyclicItem(this.eventsList[0][1] as any, this.selectedRootEvent);
		if (nextEvent) {
			this.selectEvent(nextEvent, 1);
		}
	};

	@action
	selectPrevEvent = () => {
		if (!this.selectedRootEvent) return;
		const prevEvent = prevCyclicItem(this.eventsList[0][1] as EventAction[], this.selectedRootEvent);
		if (prevEvent) {
			this.selectEvent(prevEvent, 2);
		}
	};

	@computed get selectedEvents() {
		return this.eventsList.map(([parentId]) => parentId);
	}

	private onEventsListChange = (events: Array<[string | null, EventAction[] | EventAction]>) => {
		if (events.length < 2) {
			return;
		}

		const rootSubEvents = events[1][1];

		if (rootSubEvents != null && Array.isArray(rootSubEvents) && rootSubEvents.length > 0) {
			const timestamps = rootSubEvents
				.map(event => getTimestampAsNumber(event.startTimestamp))
				.sort();

			const fromTimestamp = timestamps[0];
			const toTimestamp = timestamps[timestamps.length - 1];

			this.filterStore.setMessagesFromTimestamp(fromTimestamp);
			this.filterStore.setMessagesToTimestamp(toTimestamp);
		} else {
			const startTimestamp = getTimestampAsNumber((rootSubEvents as EventAction).startTimestamp);
			this.filterStore.setMessagesFromTimestamp(startTimestamp);
			this.filterStore.setMessagesToTimestamp(startTimestamp);
		}
	};
}
