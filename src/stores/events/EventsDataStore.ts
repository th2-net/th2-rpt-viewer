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

import { action, computed, IReactionDisposer, observable, reaction, runInAction, when } from 'mobx';
import { nanoid } from 'nanoid';
import ApiSchema from '../../api/ApiSchema';
import {
	convertEventActionToEventTreeNode,
	getErrorEventTreeNode,
	isRootEvent,
	unknownRoot,
} from '../../helpers/event';
import { EventTreeNode } from '../../models/EventAction';
import notificationsStore from '../NotificationsStore';
import EventsFilterStore from './EventsFilterStore';
import EventsStore from './EventsStore';
import EventsFilter from '../../models/filter/EventsFilter';
import { TimeRange } from '../../models/Timestamp';
import EventsSSEChannel from '../SSEChannel/EventsSSEChannel';
import { isAbortError } from '../../helpers/fetch';
import { getItemAt } from '../../helpers/array';
import { timestampToNumber } from '../../helpers/date';

interface FetchEventTreeOptions {
	timeRange: TimeRange;
	filter: EventsFilter | null;
	targetEventId?: string;
}
export default class EventsDataStore {
	private CHILDREN_COUNT_LIMIT = 50;

	constructor(
		private eventStore: EventsStore,
		private filterStore: EventsFilterStore,
		private api: ApiSchema,
	) {
		reaction(() => this.targetNodePath, this.preloadSelectedPathChildren, {
			equals: (pathA: string[], pathB: string[]) => {
				return (
					Boolean(pathA && pathB) &&
					pathA.length === pathB.length &&
					pathA.every((id, index) => id === pathB[index])
				);
			},
		});
	}

	@observable.ref
	private eventTreeEventSource: EventsSSEChannel | null = null;

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

	@observable.ref
	public targetNodeParents: EventTreeNode[] = [];

	@computed
	public get targetNodePath() {
		if (!this.targetNode) return null;
		const parentIds = this.eventStore
			.getParentNodes(this.targetNode.eventId, this.eventsCache)
			.map(parentEventNode => parentEventNode.eventId);
		return [...parentIds, this.targetNode.eventId];
	}

	@computed
	public get isLoading(): boolean {
		return (
			Boolean(this.eventTreeEventSource && this.eventTreeEventSource.isLoading) ||
			[...this.loadingParentEvents.values()].some(Boolean)
		);
	}

	@action
	public fetchEventTree = (options: FetchEventTreeOptions) => {
		const { timeRange, filter, targetEventId } = options;

		this.resetEventsTreeState({ isLoading: true });

		this.eventStore.selectedNode = null;
		this.eventStore.selectedEvent = null;

		this.filterStore.setRange(timeRange);
		this.filterStore.setEventsFilter(filter);

		if (targetEventId) {
			this.loadTargetNode(targetEventId);
		}

		this.eventStore.searchStore.onFilterChange();

		try {
			this.eventTreeEventSource?.stop();
			this.eventTreeEventSource = new EventsSSEChannel(
				{
					timeRange,
					filter,
					sseParams: {
						searchDirection: 'next',
						// load 1 more to see if there are more children
						limitForParent: this.CHILDREN_COUNT_LIMIT + 1,
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

		const eventsByParentId: { [parentEventId: string]: EventTreeNode[] } = {};
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
			if (cachedEventChildren.length < this.CHILDREN_COUNT_LIMIT) {
				const fetchedEventChildren = eventsByParentId[parentId]
					.map(event => event.eventId)
					.filter(eventId => !cachedEventChildren.includes(eventId));

				let childrenUpdate = cachedEventChildren.concat(fetchedEventChildren);

				if (childrenUpdate.length > this.CHILDREN_COUNT_LIMIT) {
					childrenUpdate = childrenUpdate.slice(0, this.CHILDREN_COUNT_LIMIT);
					this.hasUnloadedChildren.set(parentId, true);
				}
				updatedParentChildrenMapEntries.set(parentId, childrenUpdate);
			} else {
				this.hasUnloadedChildren.set(parentId, true);
			}
			if (!this.eventsCache.get(parentId) && !this.loadingParentEvents.has(parentId)) {
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

	private loadedParentNodes: EventTreeNode[][] = [];

	private parentNodesUpdateScheduler: number | null = null;

	private onParentEventsLoadedSub: IReactionDisposer | null = null;

	@action
	private loadParentNodes = async (parentId: string, isTargetNodes = false) => {
		if (!this.parentNodesUpdateScheduler) {
			this.parentNodesUpdateScheduler = window.setInterval(this.parentNodesUpdater, 600);

			this.onParentEventsLoadedSub = when(
				() => this.rootEventIds.length > 0 && !this.isLoading,
				() => {
					if (this.parentNodesUpdateScheduler) {
						window.clearInterval(this.parentNodesUpdateScheduler);
						this.parentNodesUpdateScheduler = null;
						this.parentNodesUpdater();
					}
				},
			);
		}
		let isAborted = false;
		const parentNodes: EventTreeNode[] = [];
		let currentParentId: string | null = parentId;
		let currentParentEvent = null;

		try {
			this.parentNodesLoaderAC = new AbortController();

			while (typeof currentParentId === 'string') {
				this.loadingParentEvents.set(currentParentId, true);
				// eslint-disable-next-line no-await-in-loop
				currentParentEvent = await this.api.events.getEvent(
					currentParentId,
					this.parentNodesLoaderAC.signal,
					{ probe: true },
				);

				if (!currentParentEvent) break;

				const parentNode = convertEventActionToEventTreeNode(currentParentEvent);
				parentNodes.unshift(parentNode);
				currentParentId = parentNode.parentId;
			}
		} catch (error) {
			console.error(error);
			if (!isAbortError(error)) {
				notificationsStore.addMessage({
					notificationType: 'genericError',
					header: `Error occured while fetching event ${currentParentId}`,
					description: 'Something went wrong',
					id: nanoid(),
					type: 'error',
				});
			} else {
				isAborted = true;
			}
		} finally {
			if (!isAborted) {
				let rootNode = getItemAt(parentNodes, 0);

				if (!rootNode || !isRootEvent(rootNode)) {
					const cachedRootNode =
						rootNode && rootNode.parentId !== null ? this.eventsCache.get(rootNode.parentId) : null;
					if (cachedRootNode) {
						rootNode = cachedRootNode;
					} else {
						rootNode = unknownRoot;
						parentNodes.unshift(getErrorEventTreeNode(rootNode?.parentId || parentId));
					}
					parentNodes.unshift(rootNode);
				}

				parentNodes.forEach(eventNode => {
					if (!this.eventsCache.has(eventNode.eventId)) {
						this.eventsCache.set(eventNode.eventId, eventNode);
					}
				});
				if (isTargetNodes) {
					parentNodes.forEach(parentNode => {
						this.eventStore.isExpandedMap.set(parentNode.eventId, true);
						this.loadingParentEvents.set(parentNode.eventId, false);
					});
					this.targetNodeParents = parentNodes;
					if (
						rootNode &&
						(isRootEvent(rootNode) || rootNode.isUnknown) &&
						!this.rootEventIds.includes(rootNode.eventId)
					) {
						if (this.eventStore.targetNodeId) {
							this.eventStore.scrollToEvent(this.eventStore.targetNodeId);
						}
						this.rootEventIds.push(rootNode.eventId);
					}
				} else {
					this.loadedParentNodes.push(parentNodes);
				}
			}
		}
	};

	@action
	private parentNodesUpdater = () => {
		const parentNodes = this.loadedParentNodes;
		if (!parentNodes.length) return;

		const parentChildrenMapUpdate: Map<string, string[]> = new Map();
		const parentLoadingStatusUpdate: Map<string, boolean> = new Map();
		const rootNodes: string[] = [];

		parentNodes.forEach(parentNodePath => {
			for (let i = 0; i < parentNodePath.length; i++) {
				const event = parentNodePath[i];

				const { parentId, eventId } = event;

				if (isRootEvent(event) && !rootNodes.includes(eventId)) {
					rootNodes.push(eventId);
				}

				if (parentId !== null) {
					const siblings = this.parentChildrensMap.get(parentId) || [];

					if (!siblings.includes(event.eventId)) {
						siblings.push(event.eventId);
						parentChildrenMapUpdate.set(parentId, [...new Set(siblings)]);
					}
				}

				parentLoadingStatusUpdate.set(event.eventId, false);
			}
		});

		if (rootNodes.length !== 0) {
			this.rootEventIds = [
				...this.rootEventIds,
				...rootNodes.filter(eventId => !this.rootEventIds.includes(eventId)),
			];
		}

		this.parentChildrensMap = observable.map(
			new Map([...this.parentChildrensMap, ...parentChildrenMapUpdate]),
			{
				deep: false,
			},
		);
		this.loadingParentEvents = observable.map(
			new Map([...this.loadingParentEvents, ...parentLoadingStatusUpdate]),
		);
		this.loadedParentNodes = [];
	};

	private childrenLoaders: {
		[parentId: string]: {
			loader: EventsSSEChannel;
			initialCount: number;
		};
	} = {};

	@observable
	public childrenAreUnknown: Map<string, boolean> = new Map();

	@action
	public loadChildren = (parentId: string) => {
		if (this.childrenLoaders[parentId]) {
			this.childrenLoaders[parentId].loader.stop();
			delete this.childrenLoaders[parentId];
		}

		const parentNode = this.eventsCache.get(parentId);

		if (parentNode) {
			const eventsChildren = this.eventStore.getChildrenNodes(parentId);

			const lastChild = getItemAt(eventsChildren, eventsChildren.length - 1);

			const loader = new EventsSSEChannel(
				{
					timeRange: [this.filterStore.timestampFrom, this.filterStore.timestampTo],
					filter: this.filterStore.filter,
					sseParams: {
						parentEvent: parentId,
						resumeFromId: lastChild?.eventId,
						// load 1 more to see if there are more children
						resultCountLimit: this.CHILDREN_COUNT_LIMIT + 1,
						searchDirection: 'next',
					},
				},
				{
					onResponse: events => this.onEventChildrenChunkLoaded(events, parentId),
					onError: this.onEventTreeFetchError,
					onClose: events => this.onEventChildrenLoadEnd(events, parentId),
				},
				{
					chunkSize: this.CHILDREN_COUNT_LIMIT + 1,
				},
			);

			this.childrenLoaders[parentId] = {
				loader,
				initialCount: eventsChildren.length,
			};

			this.childrenLoaders[parentId].loader.subscribe();
		}
	};

	@action
	private onEventChildrenChunkLoaded = (events: EventTreeNode[], parentId: string) => {
		if (events.length === 0) return;

		const childList = this.parentChildrensMap.get(parentId) || [];
		// eslint-disable-next-line no-param-reassign
		events = events.filter(event => !childList.includes(event.eventId));

		const initialCount = this.childrenLoaders[parentId].initialCount;
		const expectedChildrenCountLoaded =
			(Math.floor(initialCount / this.CHILDREN_COUNT_LIMIT) + 1) * this.CHILDREN_COUNT_LIMIT;

		if (childList.length + events.length > expectedChildrenCountLoaded) {
			// eslint-disable-next-line no-param-reassign
			events = events.slice(0, expectedChildrenCountLoaded - childList.length);
		}

		events.forEach(event => this.childrenAreUnknown.set(event.eventId, true));

		const newEntries: [string, EventTreeNode][] = events.map(event => [event.eventId, event]);
		const eventsMap: Map<string, EventTreeNode> = observable.map(
			new Map([...this.eventsCache, ...newEntries]),
			{ deep: false },
		);
		this.eventsCache = eventsMap;
		this.parentChildrensMap.set(parentId, [...childList, ...events.map(event => event.eventId)]);
	};

	@action
	private onEventChildrenLoadEnd = (events: EventTreeNode[], parentId: string) => {
		if (events.length === 0) {
			this.hasUnloadedChildren.set(parentId, false);
		} else {
			const childList = this.parentChildrensMap.get(parentId) || [];
			// eslint-disable-next-line no-param-reassign
			events = events.filter(event => !childList.includes(event.eventId));
			const initialCount = this.childrenLoaders[parentId].initialCount;
			const expectedChildrenCountLoaded =
				(Math.floor(initialCount / this.CHILDREN_COUNT_LIMIT) + 1) * this.CHILDREN_COUNT_LIMIT;

			if (childList.length + events.length > expectedChildrenCountLoaded) {
				this.hasUnloadedChildren.set(parentId, true);
				// eslint-disable-next-line no-param-reassign
				events = events.slice(0, expectedChildrenCountLoaded - childList.length);
			} else {
				this.hasUnloadedChildren.set(parentId, false);
			}

			this.onEventChildrenChunkLoaded(events, parentId);
		}
		this.isLoadingChildren.set(parentId, false);
		delete this.childrenLoaders[parentId];
	};

	private targetEventAC: AbortController | null = null;

	private targetEventLoadSubscription: IReactionDisposer | null = null;

	@action
	public loadTargetNode = async (targetEventId: string | null) => {
		if (this.targetEventLoadSubscription) {
			this.targetEventLoadSubscription();
		}
		this.isPreloadingTargetEventsChildren.clear();
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
				const targetEventTimestamp = timestampToNumber(event.startTimestamp);
				// TODO: add filtering too see if target event matches current filter
				if (
					targetEventTimestamp < this.filterStore.timestampFrom ||
					targetEventTimestamp > this.filterStore.timestampTo
				) {
					this.targetEventLoadSubscription();
					this.targetEventAC = null;
					this.targetNode = null;
					this.eventStore.targetNodeId = null;
					return;
				}
				const targetNode = convertEventActionToEventTreeNode(event);
				if (targetNode.parentId !== null) {
					this.loadParentNodes(targetNode.parentId, true);
				}
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
		if (!selectedNode) return;

		this.detailedEventAC?.abort();
		this.detailedEventAC = new AbortController();

		this.isLoadingSelectedEvent = true;
		try {
			const event = await this.api.events.getEvent(
				selectedNode.eventId,
				this.detailedEventAC.signal,
			);
			runInAction(() => {
				this.eventStore.selectedEvent = event;
			});
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

		const pendingChildrenLoaders = Object.values(this.childrenLoaders);
		pendingChildrenLoaders.forEach(loader => loader.loader.stop());

		this.childrenLoaders = {};

		if (this.onParentEventsLoadedSub) {
			this.onParentEventsLoadedSub();
		}

		if (this.parentNodesLoaderAC) {
			this.parentNodesLoaderAC.abort();
		}
		this.loadedParentNodes = [];
		if (this.parentNodesUpdateScheduler) {
			window.clearInterval(this.parentNodesUpdateScheduler);
			this.parentNodesUpdateScheduler = null;
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
		this.eventStore.isExpandedMap.clear();
		this.targetNode = null;
		this.targetNodeParents = [];
		this.isPreloadingTargetEventsChildren.clear();
	};

	private isPreloadingTargetEventsChildren: Map<string, boolean> = new Map();

	private preloadSelectedPathChildren = (selectedPath: string[] | null) => {
		if (selectedPath) {
			selectedPath
				.filter(eventId => {
					const loadedChildren = this.parentChildrensMap.get(eventId);
					return !loadedChildren || loadedChildren.length < this.CHILDREN_COUNT_LIMIT;
				})
				.forEach(eventId => {
					if (!this.isPreloadingTargetEventsChildren.get(eventId)) {
						this.loadChildren(eventId);
						this.isPreloadingTargetEventsChildren.set(eventId, true);
					}
				});
		}
	};
}
