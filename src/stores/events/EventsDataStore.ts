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
import { timestampToNumber } from '../../helpers/date';
import {
	convertEventActionToEventTreeNode,
	getErrorEventTreeNode,
	isEventNode,
} from '../../helpers/event';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { SSEEventChannel } from '../messages/SSEEventChannel';
import notificationsStore from '../NotificationsStore';
import EventsFilterStore from './EventsFilterStore';
import EventsStore from './EventsStore';

const EVENTS_CHILD_LIST_GAP = 50;

export default class EventsDataStore {
	constructor(
		private eventStore: EventsStore,
		private filterStore: EventsFilterStore,
		private api: ApiSchema,
	) {}

	eventTreeEventSource: EventSource | null = null;

	@observable comingEventsMap: Map<string, EventTreeNode | boolean> = new Map();

	@observable eventsByParentIdMap: Map<string, Array<EventTreeNode>> = new Map();

	@observable unloadedChildsCountMap: Map<string, number> = new Map();

	@observable isLoadingRootEvents = false;

	@observable isLoadingSelectedEvent = false;

	@observable isLoadingParentChilds = false;

	@observable isError = false;

	@observable rootNodesMap: Map<string, EventTreeNode> = new Map();

	private loadingRootNodes: Promise<EventAction>[] = [];

	@action
	public fetchEventTree = () => {
		return new Promise<void>((res, rej) => {
			if (this.eventTreeEventSource) {
				this.eventTreeEventSource.close();
			}
			this.isError = false;
			this.eventStore.selectedNode = null;
			this.isLoadingRootEvents = true;
			this.eventStore.eventTree = [];

			try {
				this.eventTreeEventSource = this.api.sse.getEventSource({
					type: 'event',
					queryParams: {
						startTimestamp: this.filterStore.filter.timestampFrom,
						endTimestamp: this.filterStore.filter.timestampTo,
						'name-values': this.filterStore.filter.names,
						'type-values': this.filterStore.filter.eventTypes,
					},
				});

				this.eventTreeEventSource.addEventListener('error', this.onEventTreeFetchError);

				this.eventTreeEventSource.addEventListener('event', this.handleComingEvent);

				this.eventTreeEventSource.addEventListener('close', async () => {
					await Promise.all(this.loadingRootNodes);
					setTimeout(() => {
						if (this.eventTreeEventSource) {
							this.eventTreeEventSource.close();
						}
						this.isLoadingRootEvents = false;
						this.comingEventsMap.clear();
						this.eventsByParentIdMap.clear();
						this.loadingRootNodes = [];
						res();
					}, 0);
				});
			} catch (error) {
				if (this.eventTreeEventSource) {
					this.eventTreeEventSource.close();
				}
				this.isError = true;
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
	private onEventTreeFetchError = (e: Event) => {
		if (e instanceof MessageEvent) {
			const errorData = JSON.parse(e.data);
			notificationsStore.addResponseError({
				type: 'error',
				header: errorData.exceptionName,
				resource: e.target instanceof EventSource ? e.target.url : e.origin,
				responseBody: errorData.exceptionCause,
				responseCode: null,
			});
			if (this.eventTreeEventSource) {
				this.eventTreeEventSource.close();
			}
			this.isError = true;
			this.eventStore.eventTree = [];
			this.comingEventsMap.clear();
			this.eventsByParentIdMap.clear();
			this.eventStore.isExpandedMap.clear();
			this.isLoadingRootEvents = false;
		}
	};

	@action
	private handleComingEvent = (e: Event) => {
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
				this.attachChildsToParent(parentEvent, [event]);
			}
			return;
		}
		if (hasParent) {
			this.loadRootEvent(event);
			return;
		}
		this.eventStore.eventTree.push(event);
	};

	@action
	private loadRootEvent = async (childEvent: EventTreeNode) => {
		const api = this.api;
		const comingEventsMap = this.comingEventsMap;
		const loadingRootNodes = this.loadingRootNodes;
		const attachChildsToParent = this.attachChildsToParent;
		// eslint-disable-next-line consistent-return, func-names
		const parentEventGenerator = async function* (event: EventTreeNode) {
			let loadedEvent = event;

			while (loadedEvent.parentId !== null) {
				if (comingEventsMap.has(loadedEvent.parentId)) return null;

				comingEventsMap.set(loadedEvent.parentId, true);
				try {
					const promise = api.events.getEvent(loadedEvent.parentId);
					loadingRootNodes.push(promise);
					loadedEvent = observable(
						convertEventActionToEventTreeNode(
							// eslint-disable-next-line no-await-in-loop
							await promise,
						),
					);
				} catch {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					loadedEvent = observable(getErrorEventTreeNode(loadedEvent.parentId!, [loadedEvent]));
				}
				const savedEvent = comingEventsMap.get(loadedEvent.eventId);
				if (savedEvent === undefined || typeof savedEvent === 'boolean') {
					comingEventsMap.set(loadedEvent.eventId, loadedEvent);
				} else {
					attachChildsToParent(savedEvent, loadedEvent.childList);
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
				this.attachChildsToParent(loadedEvent, [previousChildEvent]);
				const loadedChildren = this.eventsByParentIdMap.get(loadedEvent.eventId);

				if (loadedChildren) {
					this.attachChildsToParent(loadedEvent, loadedChildren);
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

		this.isLoadingSelectedEvent = true;
		try {
			const event = await this.api.events.getEvent(
				selectedNode.eventId,
				this.detailedEventAC.signal,
			);
			this.eventStore.selectedEvent = event;
		} catch (error) {
			console.error(`Error occurred while loading event ${selectedNode.eventId}`);
		} finally {
			this.isLoadingSelectedEvent = false;
		}
	};

	@action
	public loadMoreChilds = (parentId: string) => {
		const parentNode = this.rootNodesMap.get(parentId);

		if (parentNode && isEventNode(parentNode)) {
			this.isLoadingParentChilds = true;

			const eventsParentChannel = new SSEEventChannel(
				{
					startTimestamp: timestampToNumber(
						parentNode.childList[parentNode.childList.length - 1].startTimestamp,
					),
					endTimestamp: this.filterStore.filter.timestampTo,
					'name-values': this.filterStore.filter.names,
					'type-values': this.filterStore.filter.eventTypes,
					parentEvent: parentId,
				},
				events => {
					const childList = events.splice(1, EVENTS_CHILD_LIST_GAP);
					parentNode.childList.push(...childList);
					const unloadedCount =
						(this.unloadedChildsCountMap.get(parentNode.eventId) ?? 0) - childList.length;
					this.unloadedChildsCountMap.set(parentNode.eventId, unloadedCount);
					this.isLoadingParentChilds = false;
				},
				e => {
					this.eventStore.eventTree = [];
					this.eventStore.isExpandedMap.clear();
					this.isLoadingRootEvents = false;
					console.error('Error while loading root events', e);
				},
				{
					chunkSize: EVENTS_CHILD_LIST_GAP + 1,
				},
			);
			eventsParentChannel.subscribe();
		}
	};

	@action
	private attachChildsToParent = (parent: EventTreeNode, childList: EventTreeNode[]) => {
		const loadedChunks =
			parent.childList.length <= 50
				? 0
				: Math.floor(parent.childList.length / EVENTS_CHILD_LIST_GAP);
		const availableSpace = parent.childList.length - EVENTS_CHILD_LIST_GAP * loadedChunks;

		if (availableSpace < EVENTS_CHILD_LIST_GAP) {
			const remainingSpace = EVENTS_CHILD_LIST_GAP - availableSpace;

			if (childList.length < remainingSpace) {
				parent.childList.push(...childList);
				this.unloadedChildsCountMap.set(parent.eventId, 0);
			} else {
				const unloadedCount =
					(this.unloadedChildsCountMap.get(parent.eventId) ?? 0) +
					childList.length -
					remainingSpace;
				this.unloadedChildsCountMap.set(parent.eventId, unloadedCount);
				parent.childList.push(...childList.splice(0, remainingSpace));
			}
			this.rootNodesMap.set(parent.eventId, parent);
		} else {
			this.unloadedChildsCountMap.set(
				parent.eventId,
				(this.unloadedChildsCountMap.get(parent.eventId) ?? 0) + childList.length,
			);
		}
	};
}
