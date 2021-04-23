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

import { action, computed, IReactionDisposer, observable, runInAction, when } from 'mobx';
import ApiSchema from '../../api/ApiSchema';
import { convertEventActionToEventTreeNode, getErrorEventTreeNode } from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import { EventSSELoader } from './EventSSELoader';
import notificationsStore from '../NotificationsStore';
import EventsFilterStore from './EventsFilterStore';
import EventsStore from './EventsStore';
import { timestampToNumber } from '../../helpers/date';
import EventsFilter from '../../models/filter/EventsFilter';
import { TimeRange } from '../../models/Timestamp';

const LIMIT_FOR_PARENT = 51;

interface FetchEventTreeOptions {
	timeRange: TimeRange;
	filter: EventsFilter | null;
	targetEventId?: string;
}
export default class EventsDataStore {
	private CHUNK_SIZE = 50;

	constructor(
		private eventStore: EventsStore,
		private filterStore: EventsFilterStore,
		private api: ApiSchema,
	) {}

	@observable.ref eventTreeEventSource: EventSSELoader | null = null;

	@observable
	public eventsCache: Map<string, EventTreeNode> = new Map();

	@observable
	public parentChildrensMap: Map<string, string[]> = new Map();

	@observable
	public loadingParentEvents: Map<string, boolean> = new Map();

	@observable
	public isLoadingChildren: Map<string, boolean> = new Map();

	@observable
	public isLoadingSelectedEvent = false;

	@observable
	public isError = false;

	@observable
	public hasUnloadedChildren: Map<string, boolean> = new Map();

	@observable
	public rootEventIds: string[] = [];

	@observable.ref
	public targetNode: EventTreeNode | null = null;

	@computed
	public get isLoading(): boolean {
		return Boolean(this.eventTreeEventSource && this.eventTreeEventSource.isLoading);
	}

	@computed
	public get targetNodePath() {
		if (!this.targetNode) return null;
		const parentIds = this.eventStore
			.getParentNodes(this.targetNode.eventId, this.eventsCache)
			.map(parentEventNode => parentEventNode.eventId);
		return [...parentIds, this.targetNode.eventId];
	}

	@action
	public fetchEventTree = (options: FetchEventTreeOptions) => {
		const { timeRange, filter, targetEventId } = options;

		this.resetEventsTreeState({ isLoading: true });

		this.loadTargetNode(targetEventId || null);
		this.filterStore.setRange(timeRange);
		this.filterStore.setEventsFilter(filter);

		try {
			this.eventTreeEventSource = new EventSSELoader(
				{
					timeRange,
					filter,
					sseParams: {
						searchDirection: 'next',
						limitForParent: LIMIT_FOR_PARENT,
					},
				},
				{
					onResponse: this.handleIncomingEventTreeNodes,
					onError: this.onEventTreeFetchError,
				},
			);

			this.eventTreeEventSource.subscribe();
		} catch (error) {
			this.resetEventsTreeState({ isError: true });
		}
	};

	@action
	private handleIncomingEventTreeNodes = (events: EventTreeNode[]) => {
		const newEntries: [string, EventTreeNode][] = events.map(event => [event.eventId, event]);
		const eventsMap: Map<string, EventTreeNode> = observable.map(
			new Map([...this.eventsCache, ...newEntries]),
			{ deep: false },
		);
		this.eventsCache = eventsMap;

		const eventsByParentId: { [eventId: string]: EventTreeNode[] } = {};
		const rootEvents: EventTreeNode[] = [];

		for (let i = 0; i < events.length; i++) {
			const event = events[i];
			if (event.parentId === null) {
				rootEvents.push(event);
			} else {
				eventsByParentId[event.parentId] = (eventsByParentId[event.parentId] || []).concat(event);
			}
		}

		const updatedParentChildrenMapEntries: Map<string, string[]> = observable.map();

		Object.keys(eventsByParentId).forEach(parentId => {
			const cachedEventChildren = this.parentChildrensMap.get(parentId) || [];
			if (cachedEventChildren.length <= this.CHUNK_SIZE) {
				const fetchedEventChildren = eventsByParentId[parentId]
					.map(event => event.eventId)
					.filter(eventId => !cachedEventChildren.includes(eventId));

				let childrenUpdate = cachedEventChildren.concat(fetchedEventChildren);

				// Ignore events over chunk size on initial load
				if (childrenUpdate.length > this.CHUNK_SIZE) {
					childrenUpdate = childrenUpdate.slice(0, this.CHUNK_SIZE);
					this.hasUnloadedChildren.set(parentId, true);
				}
				updatedParentChildrenMapEntries.set(parentId, childrenUpdate);
			} else {
				this.hasUnloadedChildren.set(parentId, true);
			}
			if (!this.eventsCache.get(parentId) && !this.loadingParentEvents.get(parentId)) {
				this.loadParentNodes(parentId);
				this.loadingParentEvents.set(parentId, true);
			}
		});

		this.parentChildrensMap = observable.map(
			new Map([...this.parentChildrensMap, ...updatedParentChildrenMapEntries]),
		);

		if (rootEvents.length > 0) {
			this.rootEventIds = [
				...this.rootEventIds,
				...rootEvents
					.filter(rootEvent => !this.rootEventIds.includes(rootEvent.eventId))
					.map(({ eventId }) => eventId),
			];
		}
	};

	@action
	private onEventTreeFetchError = (e: Event) => {
		notificationsStore.handleSSEError(e);
		this.resetEventsTreeState({ isError: true });
	};

	private parentNodesLoaderAC: AbortController | null = null;

	@action
	private loadParentNodes = async (parentId: string) => {
		try {
			this.parentNodesLoaderAC = new AbortController();
			const parentEvents = await this.api.events.getEventParents(
				parentId,
				this.parentNodesLoaderAC.signal,
			);

			const parentNodes = parentEvents.map(convertEventActionToEventTreeNode);
			runInAction(() => {
				/*
					api.events.getEventParents won't throw an error if it fails to load one of parent events
					it will stop on error and return event chain that already have been loaded
					If it fails to load parent node we should create 'Unknown event'
				*/
				let rootNode = parentNodes[0];
				if (!rootNode || rootNode.parentId !== null) {
					const unknownParentNodeId = rootNode?.parentId || parentId;

					rootNode = getErrorEventTreeNode(unknownParentNodeId);

					parentNodes.unshift(rootNode);
				}
				parentNodes.forEach(parentNode => {
					this.eventsCache.set(parentNode.eventId, parentNode);

					if (parentNode.parentId !== null) {
						const children = this.parentChildrensMap.get(parentNode.parentId) || [];

						if (!children.includes(parentNode.eventId)) {
							children.push(parentNode.eventId);
							this.parentChildrensMap.set(parentNode.parentId, children);
						}
					}
					this.loadingParentEvents.delete(parentNode.eventId);
				});
				if (!this.rootEventIds.includes(rootNode.eventId)) {
					this.rootEventIds = [...this.rootEventIds, rootNode.eventId];
				}
			});
		} catch (error) {
			runInAction(() => {
				const uknownRootNode = getErrorEventTreeNode(parentId);
				this.eventsCache.set(parentId, uknownRootNode);
				if (!this.rootEventIds.includes(parentId)) {
					this.rootEventIds = [...this.rootEventIds, parentId];
				}
				this.loadingParentEvents.delete(parentId);
			});
		}
	};

	private loadingChildrenMap: { [parentId: string]: EventSSELoader } = {};

	@action
	public loadMoreChilds = (parentId: string) => {
		const parentNode = this.eventsCache.get(parentId);

		if (parentNode) {
			const eventsChildren = this.eventStore.getChildrenNodes(parentId);

			if (!eventsChildren || !this.hasUnloadedChildren.get(parentId)) return;

			this.isLoadingChildren.set(parentId, true);

			const lastChild = eventsChildren[eventsChildren.length - 1];

			this.loadingChildrenMap[parentId] = new EventSSELoader(
				{
					timeRange: [timestampToNumber(lastChild.startTimestamp), this.filterStore.timestampTo],
					filter: this.filterStore.filter,
					sseParams: {
						parentEvent: parentId,
						resumeFromId: lastChild?.eventId,
						resultCountLimit: this.CHUNK_SIZE + 1,
						searchDirection: 'next',
						limitForParent: LIMIT_FOR_PARENT,
					},
				},
				{
					onError: this.onEventTreeFetchError,
					onResponse: events => this.onEventChildrenLoad(events, parentId),
					onClose: events => this.onEventChildrenLoadEnd(events, parentId),
				},
				{
					chunkSize: this.CHUNK_SIZE + 1,
				},
			);
			this.loadingChildrenMap[parentId].subscribe();
		}
	};

	@action
	private onEventChildrenLoad = (events: EventTreeNode[], parentId: string) => {
		const newEntries: [string, EventTreeNode][] = events.map(event => [event.eventId, event]);
		const eventsMap: Map<string, EventTreeNode> = observable.map(
			new Map([...this.eventsCache, ...newEntries]),
			{ deep: false },
		);

		this.eventsCache = eventsMap;
		const parentNode = this.eventsCache.get(parentId);
		if (!parentNode) return;

		const childList = this.parentChildrensMap.get(parentId) || [];

		this.parentChildrensMap.set(parentId, [...childList, ...events.map(event => event.eventId)]);
	};

	@action
	private onEventChildrenLoadEnd = (events: EventTreeNode[], parentId: string) => {
		const childList = this.parentChildrensMap.get(parentId) || [];

		if ((childList.length + events.length) % this.CHUNK_SIZE === 1) {
			this.hasUnloadedChildren.set(parentId, true);
			events.pop();
		} else {
			this.hasUnloadedChildren.set(parentId, false);
		}

		this.onEventChildrenLoad(events, parentId);

		this.isLoadingChildren.set(parentId, false);
	};

	private targetEventAC: AbortController | null = null;

	private targetEventLoadSubscription: IReactionDisposer | null = null;

	@action
	public loadTargetNode = async (targetEventId: string | null) => {
		if (this.targetEventLoadSubscription) {
			this.targetEventLoadSubscription();
		}
		this.targetNode = null;
		this.targetEventAC?.abort();

		this.eventStore.targetNodeId = targetEventId;
		if (targetEventId) {
			this.targetEventLoadSubscription = when(
				() => this.targetNodePath !== null && this.rootEventIds.includes(this.targetNodePath[0]),
				() => {
					if (this.targetNodePath) {
						this.eventStore.onTargetNodeAddedToTree(this.targetNodePath);
					}
				},
			);
			try {
				this.targetEventAC = new AbortController();
				const event = await this.api.events.getEvent(targetEventId, this.targetEventAC.signal);
				const targetNode = convertEventActionToEventTreeNode(event);
				this.eventsCache.set(targetNode.eventId, targetNode);
				this.eventStore.onTargetEventLoad(event, targetNode);
				this.targetNode = targetNode;
			} catch (error) {
				console.error(`Couldnt fetch target event node ${targetEventId}`);
				this.eventStore.targetNodeId = null;
				this.targetEventLoadSubscription();
			}
		} else {
			this.targetEventAC?.abort();
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

	public stopCurrentRequests = () => {
		if (this.eventTreeEventSource) {
			this.eventTreeEventSource.stop();
			this.eventTreeEventSource = null;
		}

		const pendingChildrenLoaders = Object.values(this.loadingChildrenMap);
		pendingChildrenLoaders.forEach(loader => loader.stop());

		this.loadingChildrenMap = {};

		if (this.parentNodesLoaderAC) {
			this.parentNodesLoaderAC.abort();
			this.parentNodesLoaderAC = null;
		}

		this.targetEventAC?.abort();

		if (this.targetEventLoadSubscription) {
			this.targetEventLoadSubscription();
		}
	};

	@action
	public resetEventsTreeState = (
		initialState: Partial<{ isError: boolean; isLoading: boolean }> = {},
	) => {
		this.stopCurrentRequests();
		const { isError = false, isLoading = false } = initialState;

		this.isError = isError;

		this.rootEventIds = [];
		this.eventsCache.clear();
		this.parentChildrensMap.clear();
		this.loadingParentEvents.clear();
		this.isLoadingChildren.clear();
		this.hasUnloadedChildren.clear();
	};
}
