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
import ApiSchema from '../../api/ApiSchema';
import { convertEventActionToEventTreeNode, getErrorEventTreeNode } from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import FilterStore from '../FilterStore';
import EventsStore from './EventsStore';

export default class EventsDataStore {
	constructor(
		private eventStore: EventsStore,
		private filterStore: FilterStore,
		private api: ApiSchema,
	) {}

	eventTreeEventSource: EventSource | null = null;

	@observable comingEventsMap: Map<string, EventTreeNode | boolean> = new Map();

	@observable eventsByParentIdMap: Map<string, Array<EventTreeNode>> = new Map();

	@observable isLoadingRootEvents = false;

	@observable loadingSelectedEvent = false;

	@observable eventTreeStatusCode: number | null = null;

	@action
	public fetchEventTree = () => {
		return new Promise<void>((res, rej) => {
			if (this.eventTreeEventSource) {
				this.eventTreeEventSource.close();
			}
			this.eventTreeStatusCode = null;
			this.eventStore.selectedNode = null;
			this.isLoadingRootEvents = true;
			this.eventStore.eventTree = [];

			try {
				this.eventTreeEventSource = this.api.sse.getEventSource({
					type: 'event',
					queryParams: {
						startTimestamp: this.filterStore.eventsFilter.timestampFrom,
						endTimestamp: this.filterStore.eventsFilter.timestampTo,
						'name-values': this.filterStore.eventsFilter.names,
						'type-values': this.filterStore.eventsFilter.eventTypes,
					},
				});

				this.eventTreeEventSource.onerror = e => {
					if (
						this.eventTreeEventSource &&
						this.eventTreeEventSource.readyState !== EventSource.CONNECTING
					) {
						console.error(e);
						this.eventStore.eventTree = [];
						this.eventStore.isExpandedMap.clear();
						console.error('Error while loading root events', e);
					}
				};

				this.eventTreeEventSource.addEventListener('event', e => {
					const event = observable(JSON.parse((e as MessageEvent).data) as EventTreeNode);
					const savedEvent = this.comingEventsMap.get(event.eventId);
					if (savedEvent !== undefined && typeof savedEvent !== 'boolean') return;
					this.comingEventsMap.set(event.eventId, event);

					const hasParent = event.parentId !== 'null';
					const parentEvent =
						hasParent && event.parentId !== null ? this.comingEventsMap.get(event.parentId) : null;

					if (parentEvent) {
						if (parentEvent === true) {
							const accumulatedEventsByParentId = event.parentId
								? this.eventsByParentIdMap.get(event.parentId)
								: null;
							if (accumulatedEventsByParentId) {
								accumulatedEventsByParentId.push(event);
							} else if (event.parentId) {
								this.eventsByParentIdMap.set(event.parentId, [event]);
							}
						} else {
							parentEvent.childList.push(event);
						}
						return;
					}
					if (hasParent) {
						this.loadRootEvent(event);
						return;
					}
					this.eventStore.eventTree.push(event);
				});

				this.eventTreeEventSource.addEventListener('close', () => {
					if (this.eventTreeEventSource) {
						this.eventTreeEventSource.close();
					}
					this.isLoadingRootEvents = false;
					this.comingEventsMap.clear();
					this.eventsByParentIdMap.clear();
					res();
				});
			} catch (error) {
				if (this.eventTreeEventSource) {
					this.eventTreeEventSource.close();
				}
				this.eventTreeStatusCode = error.status;
				this.eventStore.eventTree = [];
				this.comingEventsMap.clear();
				this.eventsByParentIdMap.clear();
				this.eventStore.isExpandedMap.clear();
				this.isLoadingRootEvents = false;
				console.error('Error while loading root events', error);
				rej(error);
			}
		});
	};

	@action
	private loadRootEvent = async (childEvent: EventTreeNode) => {
		const api = this.api;
		const comingEventsMap = this.comingEventsMap;
		// eslint-disable-next-line consistent-return, func-names
		const parentEventGenerator = async function* (event: EventTreeNode) {
			let loadedEvent = event;

			while (loadedEvent.parentId !== null) {
				if (comingEventsMap.has(loadedEvent.parentId)) return null;

				comingEventsMap.set(loadedEvent.parentId, true);
				try {
					loadedEvent = observable(
						convertEventActionToEventTreeNode(
							// eslint-disable-next-line no-await-in-loop
							await api.events.getEvent(loadedEvent.parentId),
						),
					);
				} catch {
					loadedEvent = observable(getErrorEventTreeNode(loadedEvent.parentId!, [loadedEvent]));
				}
				const savedEvent = comingEventsMap.get(loadedEvent.eventId);
				if (savedEvent === undefined || typeof savedEvent === 'boolean') {
					comingEventsMap.set(loadedEvent.eventId, loadedEvent);
				} else {
					savedEvent.childList.push(...loadedEvent.childList);
					loadedEvent = savedEvent;
					yield null;
				}
				yield loadedEvent;
			}
			return null;
		};

		let previousChildEvent = childEvent;

		for await (const loadedEvent of parentEventGenerator(childEvent)) {
			if (loadedEvent) {
				loadedEvent.childList.push(previousChildEvent);
				const loadedChildren = this.eventsByParentIdMap.get(loadedEvent.eventId);
				if (loadedChildren) {
					loadedEvent.childList.push(...loadedChildren);
					this.eventsByParentIdMap.delete(loadedEvent.eventId);
				}
				previousChildEvent = loadedEvent;
				if (loadedEvent.parentId === null) {
					this.eventStore.eventTree.push(loadedEvent);
				}
			}
		}
	};

	private detailedEventAC: AbortController | null = null;

	@action
	public fetchDetailedEventInfo = async (selectedNode: EventTreeNode | null) => {
		this.eventStore.selectedEvent = null;
		if (!selectedNode) return;

		this.detailedEventAC?.abort();
		this.detailedEventAC = new AbortController();

		this.loadingSelectedEvent = true;
		try {
			const event = await this.api.events.getEvent(
				selectedNode.eventId,
				this.detailedEventAC.signal,
			);
			this.eventStore.selectedEvent = event;
		} catch (error) {
			console.error(`Error occurred while loading event ${selectedNode.eventId}`);
		} finally {
			this.loadingSelectedEvent = false;
		}
	};
}
