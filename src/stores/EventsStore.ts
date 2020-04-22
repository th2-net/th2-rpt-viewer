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

import { action, observable, computed } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import EventAction from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable indent */
export default class FilterStore {
	private api: ApiSchema;

	constructor(api: ApiSchema) {
		this.api = api;
	}

	@observable eventsList: Array<[string | null, EventAction[]]> = [[null, []]];

	@observable selectedEvent: EventAction | null = null;

	@observable selectedEventIsLoading = false;

	@observable selectedRootEvent: EventAction | null = null;

    @action
    getEvents = async () => {
		try {
			const events = await this.api.events.getAll();
			this.eventsList = [[null, events]];
		} catch (error) {
			console.error('Error while loading events', error);
		}
	};

	@action
	getEventChildren = async (event: EventAction) => {
		try {
			this.selectedEventIsLoading = true;
			const children = await this.api.events.getSubNodes(event.eventId);
			if (children.length > 0) {
				if (event.parentEventId === null) {
					this.eventsList = [this.eventsList[0], [event.eventId, children]];
				} else {
					const parentIndex = this.eventsList.findIndex(([parentId]) => parentId === event.parentEventId);
					this.eventsList = this.eventsList.slice(0, parentIndex).concat([event.eventId, children]);
				}
				this.selectedEventIsLoading = false;
				return;
			}
			if (event.parentEventId === null) {
				this.eventsList = [this.eventsList[0]];
			}
			this.selectedEvent = event;
			this.selectedEventIsLoading = false;
		} catch (error) {
			console.error('Error while loading event children', error);
		}
	};

	@action
	selectEvent = (event: EventAction) => {
		if (event.parentEventId === null) {
			if (this.selectedRootEvent && this.selectedRootEvent.eventId === event.eventId) return;
			this.selectedEvent = null;
			this.selectedEventIsLoading = true;
			this.selectedRootEvent = event;
			this.getEventChildren(event);

			return;
		}
		this.selectedEventIsLoading = true;
		this.selectedEvent = null;

		this.getEventChildren(event);
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
		this.selectedEvent && selected.push(this.selectedEvent.eventId);
		this.eventsList.forEach(([parentId]) => parentId && selected.push(parentId));
		return selected;
	}
}
