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

import { action, computed, observable, reaction, _allowStateChangesInsideComputed } from 'mobx';
import moment from 'moment';
import EventsFilterStore from './EventsFilterStore';
import ViewStore from '../workspace/WorkspaceViewStore';
import ApiSchema from '../../api/ApiSchema';
import { EventAction, EventTree, EventTreeNode } from '../../models/EventAction';
import EventsSearchStore from './EventsSearchStore';
import EventsFilter from '../../models/filter/EventsFilter';
import {
	getEventNodeParents,
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

export type EventStoreURLState = Partial<{
	panelArea: number;
	filter: EventsFilter;
	selectedNodesPath: string[];
	search: string[];
	flattenedListView: boolean;
	selectedParentId: string;
}>;

export type EventStoreDefaultStateType =
	| (EventStoreURLState & {
			targetEvent?: EventTreeNode | EventAction;
	  })
	| null
	| undefined;

export default class EventsStore {
	filterStore = new EventsFilterStore(this.graphStore);

	viewStore = new ViewStore();

	searchStore = new EventsSearchStore(this.api, this);

	eventDataStore = new EventsDataStore(this, this.filterStore, this.api);

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private searchPanelStore: SearchStore,
		private api: ApiSchema,
		initialState: EventStoreDefaultStateType,
	) {
		this.init(initialState);

		reaction(() => this.filterStore.filter, this.onFilterChange);

		reaction(() => this.selectedNode, this.onSelectedNodeChange);

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.searchStore.scrolledItem, this.onScrolledItemChange);

		reaction(() => this.hoveredEvent, this.onEventHover);
	}

	@observable.shallow eventTree: EventTree = [];

	@observable isLoadingRootEvents = false;

	@observable.ref selectedNode: EventTreeNode | null = null;

	@observable.ref hoveredEvent: EventTreeNode | null = null;

	@observable.ref selectedParentNode: EventTreeNode | null = null;

	@observable.ref selectedEvent: EventAction | null = null;

	@observable scrolledIndex: Number | null = null;

	@observable isExpandedMap: Map<string, boolean> = new Map();

	@observable eventTreeStatusCode: number | null = null;

	@computed get isActivePanel() {
		return this.workspaceStore.isActive && this.workspaceStore.viewStore.activePanel === this;
	}

	@computed
	public get flattenedEventList() {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(
				eventNode => eventNode.childList.length === 0 && eventNode.filtered,
			),
		);
	}

	@computed
	public get panelRange(): TimeRange {
		return [this.filterStore.filter.timestampFrom, this.filterStore.filter.timestampTo];
	}

	@computed
	public get flatExpandedList() {
		return this.eventTree.flatMap(eventId => this.getFlatExpandedList(eventId));
	}

	@computed
	public get isSelectedEventLoading() {
		return this.selectedNode !== null && this.selectedEvent === null;
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed
	public get nodesList() {
		return sortEventsByTimestamp(this.eventTree, 'desc').flatMap(eventNode =>
			this.getNodesList(eventNode),
		);
	}

	@computed
	public get selectedPath(): EventTreeNode[] {
		if (this.selectedNode == null) {
			return [];
		}
		return [
			...this.getNodesPath(getEventNodeParents(this.selectedNode), this.nodesList),
			this.selectedNode,
		];
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
					.flatMap(eventNode => this.getNodesList(eventNode))
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
	public scrollToEvent = (eventId: string | null, parentEventIds: string[] = []) => {
		if (!eventId) return;
		let index = -1;
		if (!this.viewStore.flattenedListView) {
			[...parentEventIds, eventId].forEach(id => {
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
	public onEventSelect = async (savedEventNode: EventTreeNode | EventAction) => {
		this.graphStore.setTimestamp(timestampToNumber(savedEventNode.startTimestamp));
		this.workspaceStore.viewStore.activePanel = this;
		let fullPath: string[] = [];
		/*
			While we are saving eventTreeNodes with their parents, searching returns eventTreeNodes 
			without full path, so we have to fetch it first
			
		*/
		if (!savedEventNode.parents) {
			try {
				this.eventDataStore.isLoadingRootEvents = true;
				this.selectNode(null);
				fullPath = await this.fetchFullPath(savedEventNode);
			} catch {
				this.eventDataStore.isLoadingRootEvents = false;
			}
		} else {
			fullPath = [...(savedEventNode.parents || []), savedEventNode.eventId];
		}

		const [timestampFrom, timestampTo] = calculateTimeRange(
			timestampToNumber(savedEventNode.startTimestamp),
			this.graphStore.interval,
		);

		this.filterStore.filter.timestampFrom = timestampFrom;
		this.filterStore.filter.timestampTo = timestampTo;
		this.filterStore.filter.eventTypes = [];
		this.filterStore.filter.names = [];

		await this.eventDataStore.fetchEventTree();
		this.expandPath(fullPath);
		this.eventDataStore.isLoadingRootEvents = false;
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.filterStore.filter = {
			...this.filterStore.filter,
			timestampFrom: moment(timestamp)
				.subtract((this.graphStore.interval * 60) / 2, 'seconds')
				.valueOf(),
			timestampTo: moment(timestamp)
				.add((this.graphStore.interval * 60) / 2, 'seconds')
				.valueOf(),
		};

		if (this.workspaceStore.viewStore.panelsLayout[0] < 20) {
			this.workspaceStore.viewStore.setPanelsLayout([50, 50]);
		}
	};

	@action
	public expandPath = async (selectedIds: string[]) => {
		if (selectedIds.length === 0) return;

		let headNode: EventTreeNode | undefined;
		let children = this.nodesList;

		for (let i = 0; i < selectedIds.length; i++) {
			headNode = children.find(node => node.eventId === selectedIds[i]);
			if (headNode && !this.isExpandedMap.get(headNode.eventId) && i !== selectedIds.length - 1) {
				this.toggleNode(headNode);
			}
			children = headNode?.childList || [];
		}
		if (headNode) {
			this.selectNode(headNode);
			this.scrollToEvent(
				headNode.eventId,
				selectedIds.filter(eventId => eventId !== headNode?.eventId),
			);
		}
	};

	@action
	private onFilterChange = async () => {
		await this.eventDataStore.fetchEventTree();
		this.isExpandedMap.clear();
	};

	@action
	private onSelectedNodeChange = (selectedNode: EventTreeNode | null) => {
		this.eventDataStore.fetchDetailedEventInfo(selectedNode);
		this.selectedParentNode = null;
	};

	@action
	private onViewChange = () => {
		if (this.selectedNode) {
			this.scrollToEvent(this.selectedNode.eventId || null, this.selectedNode.parents);
		}
	};

	@action
	private onScrolledItemChange = (scrolledItemId: string | null) => {
		this.scrollToEvent(scrolledItemId);
	};

	@action
	private async init(initialState: EventStoreDefaultStateType) {
		if (!initialState) {
			this.eventDataStore.fetchEventTree();
			return;
		}

		this.filterStore = new EventsFilterStore(this.graphStore, initialState.filter);
		this.searchStore = new EventsSearchStore(this.api, this, {
			searchPatterns: initialState.search,
		});
		this.viewStore = new ViewStore({
			flattenedListView: initialState.flattenedListView,
			panelArea: initialState.panelArea,
		});

		if (isEvent(initialState.targetEvent)) {
			this.onEventSelect(initialState.targetEvent);
		} else {
			await this.eventDataStore.fetchEventTree();
		}

		if (!isEvent(initialState.targetEvent) && initialState.selectedNodesPath) {
			this.expandPath(initialState.selectedNodesPath);
		}

		if (!isEvent(initialState.targetEvent) && initialState.selectedParentId) {
			const parentNode = this.selectedPath.find(
				eventNode => eventNode.eventId === initialState.selectedParentId,
			);
			this.selectedParentNode = parentNode ?? null;
		}
	}

	isNodeSelected(eventTreeNode: EventTreeNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.eventId === eventTreeNode.eventId);
	}

	private getNodesList = (
		eventTreeNode: EventTreeNode,
		parents: string[] = [],
	): EventTreeNode[] => {
		_allowStateChangesInsideComputed(() => {
			// eslint-disable-next-line no-param-reassign
			eventTreeNode.parents = !eventTreeNode.parents ? parents : eventTreeNode.parents;
		});
		if (this.isExpandedMap.get(eventTreeNode.eventId)) {
			return [
				eventTreeNode,
				...sortEventsByTimestamp(eventTreeNode.childList, 'asc').flatMap(eventNode =>
					this.getNodesList(eventNode, [...parents, eventTreeNode.eventId]),
				),
			];
		}

		return [eventTreeNode];
	};

	private getFlatExpandedList = (
		eventTreeNode: EventTreeNode,
		parents: string[] = [],
	): EventTreeNode[] => {
		_allowStateChangesInsideComputed(() => {
			// eslint-disable-next-line no-param-reassign
			eventTreeNode.parents = !eventTreeNode.parents ? parents : eventTreeNode.parents;
		});
		return [
			eventTreeNode,
			...sortEventsByTimestamp(eventTreeNode.childList).flatMap(node =>
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

		return targetNode ? [targetNode, ...this.getNodesPath(rest, targetNode.childList ?? [])] : [];
	}

	private fetchFullPath = async (event: EventTreeNode | EventAction) => {
		let currentEvent = event;
		const path: string[] = [event.eventId];

		while (
			typeof getEventParentId(currentEvent) === 'string' &&
			getEventParentId(currentEvent) !== 'null' &&
			getEventParentId(currentEvent) !== null
		) {
			const parentId = getEventParentId(currentEvent);
			if (!parentId) return path;

			path.unshift(parentId);
			// eslint-disable-next-line no-await-in-loop
			currentEvent = await this.api.events.getEvent(parentId);
		}

		return path;
	};

	private onEventHover = (hoveredEvent: EventTreeNode | null) => {
		if (hoveredEvent !== null) {
			this.graphStore.setTimestamp(timestampToNumber(hoveredEvent.startTimestamp));
		}
	};
}

const getEventParentId = (event: EventTreeNode | EventAction) =>
	isEventNode(event) ? event.parentId : event.parentEventId;
