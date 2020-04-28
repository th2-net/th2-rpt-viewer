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

import { action, autorun, computed, observable, reaction, toJS } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';
import FilterStore from './FilterStore';
import { getTimestampAsNumber } from '../helpers/date';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable indent */
export default class EventsStore {
	private api: ApiSchema;

	private filterStore: FilterStore;

	constructor(api: ApiSchema, filterStore: FilterStore) {
		this.api = api;
		this.filterStore = filterStore;

		reaction(
			() => this.eventsList,
			events => {
				if (events.length < 2) {
					return;
				}

				const rootSubEvents = events[1][1];

				if (rootSubEvents != null && rootSubEvents.length > 0) {
					const timestamps = rootSubEvents
						.map(event => getTimestampAsNumber(event.startTimestamp))
						.sort();

					const fromTimestamp = timestamps[0];
					const toTimestamp = timestamps[timestamps.length - 1];

					this.filterStore.updateMessagesTimestampFilter(fromTimestamp, toTimestamp);
				}
			},
		);
	}

	@observable eventsList: Array<[string | null, EventAction[]]> = [[null, []]];

	@observable selectedEvent: EventAction | null = null;

	@observable selectedEventIsLoading = false;

	@observable selectedRootEvent: EventAction | null = null;

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
	getEventChildren = async (event: EventAction) => {
		try {
			if (event.parentEventId !== null) {
				this.selectedEventIsLoading = true;
			}
			const children = await this.api.events.getSubNodes(event.eventId);
			if (children.length > 0) {
				if (event.parentEventId === null) {
					this.eventsList = [this.eventsList[0], [event.eventId, children]];
				} else {
					const parentIndex = this.eventsList.findIndex(([parentId]) => parentId === event.parentEventId);
					this.eventsList = [...this.eventsList.slice(0, parentIndex + 1), [event.eventId, children]];
				}
				this.selectedEventIsLoading = false;
				return;
			}
			if (event.parentEventId === null) {
				this.eventsList = [this.eventsList[0]];
			}
			if (this.eventsList[this.eventsList.length - 1][0] !== event.eventId) {
				const parentIndex = this.eventsList.findIndex(([parentId]) => parentId === event.parentEventId);
				this.eventsList = [...this.eventsList.slice(0, parentIndex + 1)];
			}
			this.selectedEvent = event;
			this.selectedEventIsLoading = false;
		} catch (error) {
			console.error('Error while loading event children', error);
		}
	};

	@action
	selectEvent = (event: EventAction) => {
		this.selectedEvent = null;
		if (event.parentEventId === null) {
			if (this.selectedRootEvent && this.selectedRootEvent.eventId === event.eventId) return;
			this.eventsList = [this.eventsList[0], [event.eventId, []]];
			this.selectedRootEvent = event;
			this.getEventChildren(event);
			return;
		}
		this.getEventChildren(event);
		// this.getMessages(event);
	};

	@action
	selectNextEvent = () => {
		if (!this.selectedRootEvent) return;
		const nextEvent = nextCyclicItem(this.eventsList[0][1], this.selectedRootEvent);
		if (nextEvent) {
			this.selectEvent(nextEvent);
		}
	};

	@action
	selectPrevEvent = () => {
		if (!this.selectedRootEvent) return;
		const prevEvent = prevCyclicItem(this.eventsList[0][1], this.selectedRootEvent);
		if (prevEvent) {
			this.selectEvent(prevEvent);
		}
	};

	@computed get selectedEvents() {
		const selected = [];
		this.eventsList.forEach(([parentId]) => selected.push(parentId));
		this.selectedEvent && selected.push(this.selectedEvent.eventId);
		return selected;
	}
}
