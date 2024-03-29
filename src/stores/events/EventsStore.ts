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
import { isEvent, isEventNode, isRootEvent, sortEventsByTimestamp } from '../../helpers/event';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { getRangeFromTimestamp, timestampToNumber } from '../../helpers/date';
import { calculateTimeRange, getRangeCenter } from '../../helpers/graph';
import { GraphStore } from '../GraphStore';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';
import EventsDataStore from './EventsDataStore';
import { EventFilterState } from '../../components/search-panel/SearchPanelFilters';
import EventsFilter from '../../models/filter/EventsFilter';
import FiltersHistoryStore from '../FiltersHistoryStore';
import { notEmpty } from '../../helpers/object';

export type EventStoreURLState = Partial<{
	panelArea: number;
	filter: Partial<EventsFilter>;
	range: TimeRange;
	selectedEventId: string;
	search: string[];
	flattenedListView: boolean;
}>;

type EventStoreDefaultState = EventStoreURLState & {
	targetEvent?: EventTreeNode | EventAction;
};

export type EventStoreDefaultStateType = EventStoreDefaultState | string | null | undefined;

export default class EventsStore {
	public filterStore!: EventsFilterStore;

	public viewStore!: ViewStore;

	public searchStore!: EventsSearchStore;

	public eventDataStore!: EventsDataStore;

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private searchPanelStore: SearchStore,
		private api: ApiSchema,
		private filterHistoryStore: FiltersHistoryStore,
		defaultState: EventStoreDefaultStateType,
	) {
		const initialState = !defaultState || typeof defaultState === 'string' ? {} : defaultState;

		this.filterStore = new EventsFilterStore(this.graphStore, this.searchPanelStore, {
			filter: initialState.filter,
			range: initialState.range,
		});
		this.viewStore = new ViewStore({
			flattenedListView: initialState.flattenedListView,
			panelArea: initialState.panelArea,
		});
		this.searchStore = new EventsSearchStore(this.api, this, {
			searchPatterns: initialState.search,
		});
		this.eventDataStore = new EventsDataStore(this, this.filterStore, this.api);

		this.init(defaultState);

		reaction(() => this.selectedNode, this.onSelectedNodeChange);

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.hoveredEvent, this.onHoveredEventChange);

		reaction(() => this.graphStore.eventInterval, this.onIntervalChange);
	}

	@observable.ref selectedNode: EventTreeNode | null = null;

	@observable.ref hoveredEvent: EventTreeNode | null = null;

	@observable.ref selectedParentNode: EventTreeNode | null = null;

	@observable.ref selectedEvent: EventAction | null = null;

	@observable scrolledIndex: Number | null = null;

	@observable isExpandedMap: Map<string, boolean> = new Map();

	@observable eventTreeStatusCode: number | null = null;

	@observable targetNodeId: string | null = null;

	@computed
	public get isLoadingTargetNode(): boolean {
		return this.targetNodeId !== null;
	}

	@computed
	public get flattenedEventList() {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(eventNode => {
				let children = this.eventDataStore.parentChildrensMap.get(eventNode.eventId) || [];

				const targetNodes = [
					...this.eventDataStore.targetNodeParents,
					this.eventDataStore.targetNode,
				].filter(notEmpty);

				const targetChild = targetNodes.find(node => node.parentId === eventNode.eventId);

				if (targetChild && !children.includes(targetChild.eventId)) {
					children = [...children, targetChild.eventId];
				}

				return children.length === 0;
			}),
		);
	}

	@computed
	public get panelRange(): TimeRange {
		return this.filterStore.range;
	}

	@computed
	public get flatExpandedList() {
		const rootIds = this.eventDataStore.rootEventIds.slice();

		if (this.eventDataStore.targetNodeParents.length) {
			const rootNode = this.eventDataStore.targetNodeParents[0];

			if (
				(isRootEvent(rootNode) || rootNode.isUnknown) &&
				!this.eventDataStore.rootEventIds.includes(rootNode.eventId)
			) {
				rootIds.push(rootNode.eventId);
			}
		}
		const rootNodes = sortEventsByTimestamp(
			rootIds.map(eventId => this.eventDataStore.eventsCache.get(eventId)).filter(isEventNode),
			'desc',
		);
		return rootNodes.flatMap(eventNode =>
			this.getFlatExpandedList(
				eventNode,
				[],
				[...this.eventDataStore.targetNodeParents.slice(1), this.eventDataStore.targetNode].filter(
					notEmpty,
				),
			),
		);
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed
	public get nodesList() {
		const rootIds = this.eventDataStore.rootEventIds.slice();

		if (this.eventDataStore.targetNodeParents.length) {
			const rootNode = this.eventDataStore.targetNodeParents[0];

			if (
				(isRootEvent(rootNode) || rootNode.isUnknown) &&
				!this.eventDataStore.rootEventIds.includes(rootNode.eventId)
			) {
				rootIds.push(rootNode.eventId);
			}
		}

		const rootNodes = sortEventsByTimestamp(
			rootIds.map(eventId => this.eventDataStore.eventsCache.get(eventId)).filter(isEventNode),
			'desc',
		);

		return rootNodes.flatMap(eventNode =>
			this.getNodesList(
				eventNode,
				[],
				[...this.eventDataStore.targetNodeParents, this.eventDataStore.targetNode].filter(
					isEventNode,
				),
			),
		);
	}

	@computed
	public get selectedPath(): EventTreeNode[] {
		if (this.selectedNode == null) {
			return [];
		}

		return [
			...this.getParentNodes(this.selectedNode.eventId, this.eventDataStore.eventsCache),
			this.selectedNode,
		];
	}

	@computed
	public get selectedPathTimestamps() {
		if (!this.selectedPath.length) return null;

		const selectedPath = this.selectedPath;

		const firstKnownEvent = selectedPath.filter(node => !node.isUnknown)[0];

		const timestamps = {
			startEventId: firstKnownEvent.eventId,
			startTimestamp: timestampToNumber(firstKnownEvent.startTimestamp),
			endEventId: firstKnownEvent.eventId,
			endTimestamp: timestampToNumber(firstKnownEvent.startTimestamp),
		};

		const eventNodes = this.getNodesList(firstKnownEvent, []);

		if (eventNodes.length > 1 && eventNodes[1]) {
			timestamps.startTimestamp = timestampToNumber(eventNodes[1].startTimestamp);
			timestamps.endTimestamp = timestamps.startTimestamp;

			for (let i = 1; eventNodes[i]; i++) {
				timestamps.endEventId = eventNodes[i].eventId;
				const parents = this.getParentNodes(eventNodes[i].eventId, this.eventDataStore.eventsCache);
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
			this.graphStore.setHoveredTimestamp(event);
		}
	}

	@action
	public toggleNode = (eventTreeNode: EventTreeNode) => {
		const isExpanded = !this.isExpandedMap.get(eventTreeNode.eventId);
		this.isExpandedMap.set(eventTreeNode.eventId, isExpanded);
	};

	@action
	public selectNode = (eventTreeNode: EventTreeNode | null) => {
		if (eventTreeNode?.isUnknown) return;

		if (eventTreeNode === null || eventTreeNode.eventId !== this.selectedNode?.eventId) {
			this.selectedNode = eventTreeNode;
		}

		if (this.viewStore.eventsPanelArea === 100) {
			this.viewStore.eventsPanelArea = 50;
		}
	};

	@action
	public scrollToEvent = (eventId: string) => {
		let index = -1;
		if (!this.viewStore.flattenedListView) {
			const parents = this.getParentNodes(eventId, this.eventDataStore.eventsCache);
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
		this.selectedNode = null;
		this.selectedEvent = null;
		this.graphStore.setTimestamp(timestampToNumber(savedEventNode.startTimestamp));
		this.workspaceStore.viewStore.activePanel = this;

		const timeRange = calculateTimeRange(
			timestampToNumber(savedEventNode.startTimestamp),
			this.graphStore.eventInterval,
		);

		this.eventDataStore.fetchEventTree({
			timeRange,
			filter: this.filterStore.filter,
			targetEventId: savedEventNode.eventId,
		});

		if (this.workspaceStore.viewStore.panelsLayout[0] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public onRangeChange = (timestampFrom: number) => {
		const timeRange = calculateTimeRange(timestampFrom, this.graphStore.eventInterval);

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
			children = (headNode && this.getChildrenNodes(headNode.eventId)) || [];
		}
		if (headNode) {
			this.selectNode(headNode);
			this.scrollToEvent(headNode.eventId);
		}
	};

	@action
	private onSelectedNodeChange = (selectedNode: EventTreeNode | null) => {
		if (selectedNode && selectedNode.eventId !== this.selectedEvent?.eventId) {
			this.selectedEvent = null;
			this.selectedParentNode = null;
			this.selectedNode = selectedNode;
			this.eventDataStore.fetchDetailedEventInfo(selectedNode);
		} else if (selectedNode === null) {
			this.selectedNode = null;
			this.selectedEvent = null;
			this.selectedParentNode = null;
		}
	};

	@action
	private onViewChange = () => {
		if (this.selectedNode) {
			this.scrollToEvent(this.selectedNode.eventId);
		}
	};

	@action
	public onTargetEventLoad = (event: EventAction, node: EventTreeNode) => {
		this.selectedEvent = event;
		if (node.eventId !== this.selectedNode?.eventId) {
			this.selectedNode = node;
		}
	};

	@action
	public onTargetNodeAddedToTree = (targetPath: string[]) => {
		if (this.targetNodeId) {
			this.expandPath(targetPath);

			const targetNode = this.eventDataStore.eventsCache.get(this.targetNodeId);
			if (targetNode) {
				this.targetNodeId = null;
			}
		}
	};

	isNodeSelected(eventTreeNode: EventTreeNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.eventId === eventTreeNode.eventId);
	}

	private init = async (defaultState: EventStoreDefaultStateType) => {
		let initialState = !defaultState || typeof defaultState === 'string' ? {} : defaultState;

		if (typeof defaultState === 'string') {
			try {
				const event = await this.api.events.getEvent(defaultState);
				this.filterStore.setEventsRange(
					getRangeFromTimestamp(
						timestampToNumber(event.startTimestamp),
						this.graphStore.eventInterval,
					),
				);
				initialState = { ...initialState, selectedEventId: event.eventId, targetEvent: event };
				this.goToEvent(event);
			} catch (error) {
				console.error(`Couldnt fetch target event node ${defaultState}`);
				this.eventDataStore.fetchEventTree({
					filter: this.filterStore.filter,
					timeRange: this.filterStore.range,
					targetEventId: initialState.selectedEventId,
				});
			}
		} else if (isEvent(initialState.targetEvent)) {
			this.goToEvent(initialState.targetEvent);
		} else {
			this.eventDataStore.fetchEventTree(
				{
					filter: this.filterStore.filter,
					timeRange: this.filterStore.range,
					targetEventId: initialState.selectedEventId,
				},
				true,
			);
		}
	};

	private onIntervalChange = (interval: number) => {
		const intervalMs = interval * 60 * 1000;
		let timestampFrom = this.graphStore.timestamp.valueOf() - intervalMs / 2;
		let timestampTo = this.graphStore.timestamp.valueOf() + intervalMs / 2;
		const now = moment.utc().valueOf();
		if (timestampTo > now) {
			timestampTo = now;
			timestampFrom = timestampTo - intervalMs;
		}
		const timeRange: TimeRange = [timestampFrom, timestampTo];
		this.eventDataStore.fetchEventTree({
			filter: this.filterStore.filter,
			timeRange,
			targetEventId: this.selectedNode?.eventId,
		});
	};

	private getNodesList = (
		eventTreeNode: EventTreeNode,
		parents: string[],
		targetNodes: EventTreeNode[] = [],
	): EventTreeNode[] => {
		const childList = this.getChildrenNodes(eventTreeNode.eventId);

		const targetNode = targetNodes.find(eventNode => eventNode.parentId === eventTreeNode.eventId);

		if (targetNode && !childList.some(childEvent => childEvent.eventId === targetNode.eventId)) {
			childList.push(targetNode);
		}

		if (this.isExpandedMap.get(eventTreeNode.eventId)) {
			const path = [
				eventTreeNode,
				...childList.flatMap(eventNode =>
					this.getNodesList(eventNode, [...parents, eventTreeNode.eventId], targetNodes),
				),
			];

			return path;
		}

		return [eventTreeNode];
	};

	private getFlatExpandedList = (
		eventTreeNode: EventTreeNode,
		parents: string[] = [],
		targetNodes: EventTreeNode[],
	): EventTreeNode[] => {
		let childList = this.getChildrenNodes(eventTreeNode.eventId);

		const targetNode = targetNodes.find(node => node.parentId === eventTreeNode.eventId);

		if (targetNode && !childList.find(event => event.eventId === targetNode.eventId)) {
			childList = sortEventsByTimestamp([...childList, targetNode]);
		}

		return [
			eventTreeNode,
			...childList.flatMap(node =>
				this.getFlatExpandedList(node, [...parents, eventTreeNode.eventId], targetNodes),
			),
		];
	};

	private onHoveredEventChange = (hoveredEvent: EventTreeNode | null) => {
		if (hoveredEvent !== null) {
			this.graphStore.setTimestamp(timestampToNumber(hoveredEvent.startTimestamp));
		}
	};

	public getParentNodes(eventId: string, cache: Map<string, EventTreeNode>): EventTreeNode[] {
		let event = cache.get(eventId);
		const path = [];

		while (event && event?.parentId !== null) {
			event = cache.get(event.parentId);
			path.unshift(event);
		}

		return path.filter(isEventNode);
	}

	public getChildrenNodes(parentId: string) {
		return sortEventsByTimestamp(
			(this.eventDataStore.parentChildrensMap.get(parentId) || [])
				.map(childrenId => this.eventDataStore.eventsCache.get(childrenId))
				.filter(isEventNode),
			'asc',
		);
	}

	public dispose = () => {
		this.filterStore.dispose();
		this.searchStore.dispose();
		this.eventDataStore.stopCurrentRequests();
	};

	public applyFilter = (filter: EventFilterState) => {
		this.filterHistoryStore.onEventFilterSubmit(filter);

		this.eventDataStore.fetchEventTree({ filter, timeRange: this.filterStore.range });
	};

	public clearFilter = () => {
		const defaultFilter = this.filterStore.resetEventsFilter();
		this.eventDataStore.fetchEventTree({
			filter: defaultFilter,
			timeRange: this.filterStore.range,
		});
	};

	public changeEventsRange = (timerange: TimeRange) => {
		this.eventDataStore.fetchEventTree({
			timeRange: timerange,
			filter: this.filterStore.filter,
		});

		this.graphStore.setTimestamp(getRangeCenter(timerange));
	};
}
