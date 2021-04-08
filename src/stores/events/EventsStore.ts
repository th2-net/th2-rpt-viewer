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

import { action, computed, observable, reaction } from 'mobx';
import moment from 'moment';
import EventsFilterStore from './EventsFilterStore';
import ViewStore from '../workspace/WorkspaceViewStore';
import ApiSchema from '../../api/ApiSchema';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import EventsSearchStore from './EventsSearchStore';
import {
	convertEventActionToEventTreeNode,
	isEvent,
	isEventNode,
	sortEventsByTimestamp,
} from '../../helpers/event';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { timestampToNumber } from '../../helpers/date';
import { calculateTimeRange } from '../../helpers/graph';
import { GraphStore } from '../GraphStore';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';
import EventsDataStore from './EventsDataStore';
import { EventFilterState } from '../../components/search-panel/SearchPanelFilters';
import EventsFilter from '../../models/filter/EventsFilter';

export type EventStoreURLState = Partial<{
	panelArea: number;
	filter: Partial<EventsFilter>;
	range: TimeRange;
	selectedEventId: string;
	search: string[];
	flattenedListView: boolean;
}>;

export type EventStoreDefaultStateType =
	| (EventStoreURLState & {
			targetEvent?: EventTreeNode | EventAction;
	  })
	| null
	| undefined;

export default class EventsStore {
	public filterStore: EventsFilterStore;

	public viewStore: ViewStore;

	public searchStore: EventsSearchStore;

	public eventDataStore: EventsDataStore;

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private searchPanelStore: SearchStore,
		private api: ApiSchema,
		initialState: EventStoreDefaultStateType,
	) {
		this.filterStore = new EventsFilterStore(this.graphStore, this.searchPanelStore, {
			filter: initialState?.filter,
			range: initialState?.range,
		});
		this.viewStore = new ViewStore({
			flattenedListView: initialState?.flattenedListView,
			panelArea: initialState?.panelArea,
		});
		this.searchStore = new EventsSearchStore(this.api, this, {
			searchPatterns: initialState?.search,
		});
		this.eventDataStore = new EventsDataStore(this, this.filterStore, this.api);

		if (initialState && isEvent(initialState.targetEvent)) {
			this.goToEvent(initialState.targetEvent);
		} else {
			this.eventDataStore.fetchEventTree({
				filter: this.filterStore.filter,
				timeRange: this.filterStore.range,
				targetEventId: initialState?.selectedEventId,
			});
		}

		reaction(() => this.filterStore.filter, this.onFilterChange);

		reaction(() => this.selectedNode, this.onSelectedNodeChange);

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.searchStore.scrolledItem, this.onScrolledItemChange);

		reaction(() => this.hoveredEvent, this.onHoveredEventChange);

		reaction(() => this.targetEventId, this.onTargetEventIdChange);

		reaction(() => this.targetEventPath, this.onTargetNodePathChange);
	}

	@observable isLoadingRootEvents = false;

	@observable.ref selectedNode: EventTreeNode | null = null;

	@observable.ref hoveredEvent: EventTreeNode | null = null;

	@observable.ref selectedParentNode: EventTreeNode | null = null;

	@observable.ref selectedEvent: EventAction | null = null;

	@observable scrolledIndex: Number | null = null;

	@observable isExpandedMap: Map<string, boolean> = new Map();

	@observable eventTreeStatusCode: number | null = null;

	@observable targetEventId: string | null = null;

	@observable.ref targetNode: EventTreeNode | null = null;

	@computed
	public get targetEventPath() {
		if (!this.targetNode) return null;
		const parentIds = this.getParents(this.targetNode.eventId, this.eventDataStore.eventsCache).map(
			parentEventNode => parentEventNode.eventId,
		);
		return [...parentIds, this.targetNode.eventId];
	}

	@computed
	public get flattenedEventList() {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(eventNode => {
				const children = this.eventDataStore.parentChildrensMap.get(eventNode.eventId);
				return (!children || children.length === 0) && eventNode.filtered;
			}),
		);
	}

	@computed
	public get panelRange(): TimeRange {
		return this.filterStore.range;
	}

	@computed
	public get flatExpandedList() {
		const rootNodes = sortEventsByTimestamp(
			this.eventDataStore.rootEventIds
				.map(eventId => this.eventDataStore.eventsCache.get(eventId))
				.filter(isEventNode),
			'desc',
		);
		return rootNodes.flatMap(eventNode => this.getFlatExpandedList(eventNode));
	}

	@computed
	public get isSelectedEventLoading() {
		return this.selectedNode !== null && this.selectedEvent === null;
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed
	public get nodesList() {
		const rootNodes = sortEventsByTimestamp(
			this.eventDataStore.rootEventIds
				.map(eventId => this.eventDataStore.eventsCache.get(eventId))
				.filter(isEventNode),
			'desc',
		);

		return rootNodes.flatMap(eventNode => this.getNodesList(eventNode, [], this.targetNode));
	}

	@computed
	public get selectedPath(): EventTreeNode[] {
		if (this.selectedNode == null) {
			return [];
		}

		const selectedNodeParents = this.getParents(
			this.selectedNode.eventId,
			this.eventDataStore.eventsCache,
		).map(node => node.eventId);

		return [...this.getNodesPath(selectedNodeParents, this.nodesList), this.selectedNode];
	}

	@computed
	public get selectedPathTimestamps() {
		if (!this.selectedPath.length) return null;

		const selectedPath = this.selectedPath;

		const rootEvent = selectedPath[0];

		const timestamps = {
			startEventId: rootEvent.eventId,
			startTimestamp: timestampToNumber(rootEvent.startTimestamp),
			endEventId: rootEvent.eventId,
			endTimestamp: timestampToNumber(rootEvent.startTimestamp),
		};

		const eventNodes = this.getNodesList(rootEvent, []);

		if (eventNodes.length > 1 && eventNodes[1]) {
			timestamps.startTimestamp = timestampToNumber(eventNodes[1].startTimestamp);
			timestamps.endTimestamp = timestamps.startTimestamp;

			for (let i = 1; eventNodes[i]; i++) {
				timestamps.endEventId = eventNodes[i].eventId;
				const parents = this.getParents(eventNodes[i].eventId, this.eventDataStore.eventsCache);
				if (parents?.length === 1) {
					const eventTimestamp = timestampToNumber(eventNodes[i].startTimestamp);

					if (eventTimestamp < timestamps.startTimestamp) {
						timestamps.startTimestamp = eventTimestamp;
					}

					if (eventTimestamp > timestamps.endTimestamp) {
						timestamps.endTimestamp = eventTimestamp;
					}
				}
			}
		}

		return timestamps;
	}

	@action
	public setHoveredEvent(event: EventTreeNode | null) {
		if (event !== this.hoveredEvent) {
			this.hoveredEvent = event;
		}
	}

	@action
	public toggleNode = (eventTreeNode: EventTreeNode) => {
		const isExpanded = !this.isExpandedMap.get(eventTreeNode.eventId);
		this.isExpandedMap.set(eventTreeNode.eventId, isExpanded);
		if (isExpanded) {
			this.searchStore.appendResultsForEvent(eventTreeNode.eventId);
		} else if (eventTreeNode.childList.length) {
			this.searchStore.removeEventsResults(
				eventTreeNode.childList
					.flatMap(eventNode => this.getNodesList(eventNode, []))
					.map(node => node.eventId),
			);
		}
	};

	@action
	public selectNode = (eventTreeNode: EventTreeNode | null) => {
		this.selectedNode = eventTreeNode;
		if (this.viewStore.eventsPanelArea === 100) {
			this.viewStore.eventsPanelArea = 50;
		}
	};

	@action
	public scrollToEvent = (eventId: string | null) => {
		if (!eventId) return;
		let index = -1;
		if (!this.viewStore.flattenedListView) {
			const parents = this.getParents(eventId, this.eventDataStore.eventsCache);
			[...parents.map(parentNode => parentNode.eventId), eventId].forEach(id => {
				const eventIndex = this.nodesList.findIndex(ev => ev.eventId === id);
				if (eventIndex !== -1 && id !== eventId) this.isExpandedMap.set(id, true);
				if (id === eventId) this.scrolledIndex = new Number(eventIndex);
			});
		} else {
			index = this.flattenedEventList.findIndex(event => event.eventId === eventId);
			this.scrolledIndex = index !== -1 ? new Number(index) : null;
		}
	};

	@action
	public goToEvent = async (savedEventNode: EventTreeNode | EventAction) => {
		this.graphStore.setTimestamp(timestampToNumber(savedEventNode.startTimestamp));
		this.workspaceStore.viewStore.activePanel = this;

		const timeRange = calculateTimeRange(
			timestampToNumber(savedEventNode.startTimestamp),
			this.graphStore.interval,
		);

		this.eventDataStore.fetchEventTree({
			timeRange,
			filter: null,
			targetEventId: savedEventNode.eventId,
		});
	};

	@action
	public onRangeChange = (timestampFrom: number) => {
		const timeRange = calculateTimeRange(timestampFrom, this.graphStore.interval);

		this.eventDataStore.fetchEventTree({
			timeRange,
			filter: this.filterStore.filter,
		});

		if (this.workspaceStore.viewStore.panelsLayout[0] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public expandPath = (selectedIds: string[]) => {
		if (selectedIds.length === 0) return;

		let headNode: EventTreeNode | undefined;
		let children = this.nodesList;

		for (let i = 0; i < selectedIds.length; i++) {
			headNode = children.find(node => node.eventId === selectedIds[i]);

			if (headNode && !this.isExpandedMap.get(headNode.eventId) && i !== selectedIds.length - 1) {
				this.toggleNode(headNode);
			}
			children = (headNode && this.eventDataStore.getEventChildrenNodes(headNode.eventId)) || [];

			if (this.targetNode && headNode?.eventId === this.targetNode.parentId) {
				children.push(this.targetNode);
			}
		}
		if (headNode) {
			this.selectNode(headNode);
			this.scrollToEvent(headNode.eventId);
		}
	};

	@action
	private onFilterChange = () => {
		this.isExpandedMap.clear();
		this.selectedParentNode = null;
		this.selectedNode = null;
		this.selectedEvent = null;
		this.targetEventAC?.abort();
	};

	@action
	private onSelectedNodeChange = (selectedNode: EventTreeNode | null) => {
		this.eventDataStore.fetchDetailedEventInfo(selectedNode);
		this.selectedParentNode = null;
	};

	@action
	private onViewChange = () => {
		if (this.selectedNode) {
			this.scrollToEvent(this.selectedNode.eventId);
		}
	};

	@action
	private onScrolledItemChange = (scrolledItemId: string | null) => {
		this.scrollToEvent(scrolledItemId);
	};

	private targetEventAC: AbortController | null = null;

	private onTargetEventIdChange = async (targetEventId: string | null) => {
		if (targetEventId) {
			try {
				this.targetNode = null;
				this.targetEventAC?.abort();
				this.targetEventAC = new AbortController();

				const event = await this.api.events.getEvent(targetEventId, this.targetEventAC.signal);
				const targetNode = convertEventActionToEventTreeNode(event);
				this.eventDataStore.eventsCache.set(targetNode.eventId, targetNode);

				const siblings =
					targetNode.parentId === null
						? this.eventDataStore.rootEventIds
						: this.eventDataStore.getEventChildrenNodes(targetNode.parentId).map(e => e.eventId);

				if (!siblings.includes(targetNode.eventId)) {
					this.targetNode = targetNode;
				}
			} catch (error) {
				console.error(`Couldnt fetch target event ${targetEventId}`);
				this.targetEventId = null;
			}
		}
	};

	@action
	private onTargetNodePathChange = (targetPath: string[] | null) => {
		if (targetPath && this.targetNode && this.eventDataStore.rootEventIds.includes(targetPath[0])) {
			this.expandPath(targetPath);
			this.targetEventId = null;

			const siblings =
				this.targetNode.parentId === null
					? this.eventDataStore.rootEventIds
					: this.eventDataStore.getEventChildrenNodes(this.targetNode.parentId).map(e => e.eventId);

			if (siblings.includes(this.targetNode.eventId)) {
				this.targetNode = null;
				this.targetEventId = null;
			}
		}
	};

	isNodeSelected(eventTreeNode: EventTreeNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.eventId === eventTreeNode.eventId);
	}

	private getNodesList = (
		eventTreeNode: EventTreeNode,
		parents: string[],
		targetNode: EventTreeNode | null = null,
	): EventTreeNode[] => {
		const childList = this.eventDataStore.getEventChildrenNodes(eventTreeNode.eventId);

		if (this.isExpandedMap.get(eventTreeNode.eventId)) {
			const path = [
				eventTreeNode,
				...childList.flatMap(eventNode =>
					this.getNodesList(eventNode, [...parents, eventTreeNode.eventId], targetNode),
				),
			];

			if (
				targetNode &&
				targetNode.parentId !== null &&
				eventTreeNode.eventId === targetNode.parentId &&
				!childList.some(childEvent => childEvent.eventId === targetNode.eventId)
			) {
				path.push(targetNode);
			}
			return path;
		}

		return [eventTreeNode];
	};

	private getFlatExpandedList = (
		eventTreeNode: EventTreeNode,
		parents: string[] = [],
	): EventTreeNode[] => {
		const childList = this.eventDataStore.getEventChildrenNodes(eventTreeNode.eventId);
		return [
			eventTreeNode,
			...childList.flatMap(node =>
				this.getFlatExpandedList(node, [...parents, eventTreeNode.eventId]),
			),
		];
	};

	private getNodesPath(path: string[], nodes: EventTreeNode[]): EventTreeNode[] {
		if (path.length === 0 || nodes.length === 0) {
			return [];
		}
		const [currentId, ...rest] = path;
		const targetNode = nodes.find(n => n.eventId === currentId);
		const childList = targetNode
			? this.eventDataStore.getEventChildrenNodes(targetNode.eventId)
			: [];
		return targetNode ? [targetNode, ...this.getNodesPath(rest, childList)] : [];
	}

	private onHoveredEventChange = (hoveredEvent: EventTreeNode | null) => {
		if (hoveredEvent !== null) {
			this.graphStore.setTimestamp(timestampToNumber(hoveredEvent.startTimestamp));
		}
	};

	public getParents(eventId: string, cache: Map<string, EventTreeNode>): EventTreeNode[] {
		let event = cache.get(eventId);
		const path = [];

		while (event && event?.parentId !== null) {
			event = cache.get(event.parentId);
			path.unshift(event);
		}

		return path.filter(isEventNode);
	}

	public dispose = () => {
		this.filterStore.dispose();
		this.eventDataStore.stopCurrentRequests();
		this.targetEventAC?.abort();
	};

	public applyFilter = (filter: EventFilterState) => {
		this.filterStore.setEventsFilter(filter);
		this.cancelTargetPathLoading();
	};

	public clearFilter = () => {
		this.filterStore.resetEventsFilter();
		this.cancelTargetPathLoading();
	};

	@action
	public cancelTargetPathLoading = () => {
		this.targetEventId = null;
		this.targetEventAC?.abort();
		this.targetNode = null;
	};

	public changeEventsRange = (minutesOffset: number) => {
		const timestampFrom = moment
			.utc(this.filterStore.timestampFrom)
			.add(minutesOffset, 'minutes')
			.valueOf();
		const timestampTo = moment
			.utc(timestampFrom)
			.add(this.graphStore.interval, 'minutes')
			.valueOf();

		this.eventDataStore.fetchEventTree({
			timeRange: [timestampFrom, timestampTo],
			filter: this.filterStore.filter,
		});
	};
}
