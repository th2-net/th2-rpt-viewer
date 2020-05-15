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
import FilterStore from './FilterStore';
import MessagesStore from './MessagesStore';
import ViewStore from './ViewStore';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';
import { isRootEvent } from '../helpers/event';
import { getTimestampAsNumber } from '../helpers/date';
import SearchStore from './SearchStore';

export default class EventWindowStore {
	filterStore: FilterStore = new FilterStore();

	messagesStore: MessagesStore = new MessagesStore(this.api, this.filterStore);

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore();

	constructor(private api: ApiSchema) {
		reaction(
			() => this.rootEventSubEvents,
			this.onEventsListChange,
		);
	}

	@observable events: Array<EventAction> = [];

	@observable isLoadingRootEvents = false;

	@observable selectedEvent: EventAction | null = null;

	@observable loadingEvents: Map<string, boolean> = new Map();

	@observable expandPath: Array<string> = [];

	@computed get selectedRootEvent() {
		if (!this.expandPath.length) return null;

		return this.events.find(event => event.eventId === this.expandPath[0]) || null;
	}

	@computed get rootEventSubEvents() {
		return this.selectedRootEvent?.subNodes || null;
	}

	@action
	expandNode = (path: string[], event: EventAction) => {
		this.getEventSubNodes(event, path);
		if (this.expandPath.includes(event.eventId)) {
			this.expandPath = path;
		} else {
			this.expandPath = [...path, event.eventId];
		}
	};

	@action
	selectEvent = (event: EventAction, path: string[]) => {
		this.selectedEvent = event;
		this.expandNode(path, event);
	};

	@action
	getRootEvents = async () => {
		this.isLoadingRootEvents = true;
		try {
			const events = await this.api.events.getAll();
			this.isLoadingRootEvents = false;
			events.sort((a, b) => b.startTimestamp.epochSecond - a.startTimestamp.epochSecond);
			this.events = events;
		} catch (error) {
			console.error('Error while loading events', error);
		}
	};

	@action
	getEventSubNodes = async (event: EventAction, path: string[]) => {
		if (event.subNodes || this.loadingEvents.get(event.eventId)) return;
		this.loadingEvents.set(event.eventId, true);
		try {
			const children = await this.api.events.getSubNodes(event.eventId);
			this.loadingEvents.set(event.eventId, false);
			let { events } = this;
			let parentNode: EventAction | undefined;
			if (isRootEvent(event)) {
				parentNode = events.find(e => e.eventId === event.eventId);
				set(parentNode!, 'subNodes', observable.array(children));
				return;
			}
			while (path.length > 0) {
				const parentId = path.shift();
				parentNode = events.find(e => e.eventId === parentId);
				events = parentNode?.subNodes || [];
			}
			if (parentNode) {
				if (!parentNode.subNodes) {
					set(parentNode, 'subNodes', observable.array(children));
				} else {
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

	private onEventsListChange = (rootEventSubEvents: EventAction[] | null) => {
		if (!rootEventSubEvents || !rootEventSubEvents.length) return;
		const timestamps = rootEventSubEvents
			.map(event => getTimestampAsNumber(event.startTimestamp))
			.sort();
		const fromTimestamp = timestamps[0];
		const toTimestamp = timestamps[timestamps.length - 1];

		this.filterStore.setMessagesFromTimestamp(fromTimestamp);
		this.filterStore.setMessagesToTimestamp(toTimestamp);
	};
}
