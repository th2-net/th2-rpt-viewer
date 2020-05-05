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

import {
	action,
	computed,
	observable,
	reaction,
	set,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';
import FilterStore from './FilterStore';
import { getTimestampAsNumber } from '../helpers/date';
import { isRootEvent } from '../helpers/event';

/* eslint-disable indent */
export default class EventsStore {
	subNodesAbortController: undefined | null | AbortController;

	constructor(
		private api: ApiSchema,
		private filterStore: FilterStore,
	) {
		reaction(
			() => this.selectedRootEventSubNodes,
			this.onEventsListChange,
		);
	}

	@observable events: Array<EventAction> = [];

	@observable selectedEvent: EventAction | null = null;

	@observable loadingEventId: null | string = null;

	@observable expandPath: Array<string> = [];

	@computed get selectedRootEvent() {
		if (!this.expandPath.length) return null;

		return this.events.find(event => event.eventId === this.expandPath[0])!;
	}

	@computed get selectedRootEventSubNodes() {
		return this.selectedRootEvent?.subNodes;
	}

	@action
	expandNode = (path: string[], event: EventAction) => {
		if (!event.subNodes) {
			this.getEventSubNodes(event, path);
		}
		this.expandPath = path;
	};

	@action
	getEvents = async () => {
		try {
			const events = await this.api.events.getAll();
			events.sort((a, b) => b.startTimestamp.epochSecond - a.startTimestamp.epochSecond);
			this.events = events;
		} catch (error) {
			console.error('Error while loading events', error);
		}
	};

	@action
	getEventSubNodes = async (event: EventAction, path: string[]) => {
		if (event.subNodes) return;
		this.loadingEventId = event.eventId;
		try {
			const children = await this.api.events.getSubNodes(event.eventId);
			this.subNodesAbortController = null;
			this.loadingEventId = null;
			let { events } = this;
			let parentNode: EventAction | undefined;
			if (isRootEvent(event)) {
				parentNode = events.find(e => e.eventId === event.eventId);
				set(parentNode!, 'subNodes', observable.array(children));
				return;
			}
			while (path.length > 0) {
				const nextParentNode = path.shift();
				parentNode = events.find(e => e.eventId === nextParentNode);
				events = parentNode?.subNodes || [];
			}
			if (parentNode) {
				if (!parentNode.subNodes) {
					set(parentNode, 'subNodes', observable.array(children));
				} else {
				// eslint-disable-next-line no-confusing-arrow
				parentNode.subNodes = parentNode.subNodes?.map(e => {
					if (e.eventId !== event.eventId) return e;
					set(e, 'subNodes', observable.array(children));
					return e;
					});
				}
			}
		} catch (error) {
			console.error('Error while loading event children', error);
		}
	};

	@action
	selectEvent = (event: EventAction) => {
		this.selectedEvent = event;
	};

	@action
	selectNextEvent = () => {
		if (!this.selectedRootEvent) return;
		const nextEvent = nextCyclicItem(this.events, this.selectedRootEvent);
		if (nextEvent) {
			this.expandNode([nextEvent.eventId], nextEvent);
		}
	};

	@action
	selectPrevEvent = () => {
		if (!this.selectedRootEvent) return;
		const prevEvent = prevCyclicItem(this.events, this.selectedRootEvent);
		if (prevEvent) {
			this.expandNode([prevEvent.eventId], prevEvent);
		}
	};

	private onEventsListChange = (rootSubEvents: EventAction[] | undefined) => {
		if (!rootSubEvents || !rootSubEvents.length) return;
		if (Array.isArray(rootSubEvents)) {
			const timestamps = rootSubEvents
				.map(event => getTimestampAsNumber(event.startTimestamp))
				.sort();

			const fromTimestamp = timestamps[0];
			const toTimestamp = timestamps[timestamps.length - 1];

			this.filterStore.setMessagesFromTimestamp(fromTimestamp);
			this.filterStore.setMessagesToTimestamp(toTimestamp);
		}
	};
}
