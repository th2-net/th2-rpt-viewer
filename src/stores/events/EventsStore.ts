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

import { action, computed, observable, reaction, runInAction, makeObservable } from 'mobx';
import moment from 'moment';
import ViewStore from 'stores/workspace/WorkspaceViewStore';
import ApiSchema from 'api/ApiSchema';
import { EventAction, EventTree, EventTreeNode } from 'models/EventAction';
import EventsFilter from 'models/filter/EventsFilter';
import {
	getEventNodeParents,
	getEventParentId,
	isEvent,
	sortEventsByTimestamp,
} from 'helpers/event';
import WorkspaceStore from 'stores/workspace/WorkspaceStore';
import { timestampToNumber } from 'helpers/date';
import { calculateTimeRange } from 'helpers/graph';
import { TimeRange } from 'models/Timestamp';
import { GraphStore } from '../GraphStore';
import { SearchStore } from '../SearchStore';
import EventsFilterStore from './EventsFilterStore';
import EventsSearchStore from './EventsSearchStore';

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
	public filterStore = new EventsFilterStore(this.graphStore);

	public viewStore = new ViewStore();

	public searchStore = new EventsSearchStore(this.api, this);

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private searchPanelStore: SearchStore,
		private api: ApiSchema,
		initialState: EventStoreDefaultStateType,
	) {
		makeObservable<
			EventsStore,
			| 'fetchEventTree'
			| 'fetchDetailedEventInfo'
			| 'onFilterChange'
			| 'onSelectedNodeChange'
			| 'onViewChange'
			| 'onScrolledItemChange'
			| 'init'
		>(this, {
			eventTree: observable.shallow,
			isLoadingRootEvents: observable,
			selectedNode: observable.ref,
			hoveredEvent: observable.ref,
			selectedParentNode: observable.ref,
			selectedEvent: observable.ref,
			loadingSelectedEvent: observable,
			scrolledIndex: observable,
			isExpandedMap: observable,
			eventTreeStatusCode: observable,
			flattenedEventList: computed,
			panelRange: computed,
			flatExpandedList: computed,
			isSelectedEventLoading: computed,
			nodesList: computed,
			selectedPath: computed,
			setHoveredEvent: action,
			toggleNode: action,
			selectNode: action,
			scrollToEvent: action,
			fetchEventTree: action,
			onEventSelect: action,
			onRangeChange: action,
			fetchDetailedEventInfo: action,
			expandPath: action,
			onFilterChange: action,
			onSelectedNodeChange: action,
			onViewChange: action,
			onScrolledItemChange: action,
			init: action,
		});

		this.init(initialState);

		reaction(() => this.filterStore.filter, this.onFilterChange);

		reaction(() => this.selectedNode, this.onSelectedNodeChange);

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.searchStore.scrolledItem, this.onScrolledItemChange);
	}

	public eventTree: EventTree = [];

	public isLoadingRootEvents = false;

	public selectedNode: EventTreeNode | null = null;

	public hoveredEvent: EventTreeNode | null = null;

	public selectedParentNode: EventTreeNode | null = null;

	public selectedEvent: EventAction | null = null;

	public loadingSelectedEvent = false;

	public scrolledIndex: Number | null = null;

	public isExpandedMap: Map<string, boolean> = new Map();

	public eventTreeStatusCode: number | null = null;

	public get flattenedEventList(): EventTreeNode[] {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(
				eventNode => eventNode.childList.length === 0 && eventNode.filtered,
			),
		);
	}

	public get panelRange(): TimeRange {
		return [this.filterStore.filter.timestampFrom, this.filterStore.filter.timestampTo];
	}

	public get flatExpandedList(): EventTreeNode[] {
		return this.eventTree.flatMap(eventId => this.getFlatExpandedList(eventId));
	}

	public get isSelectedEventLoading(): boolean {
		return this.selectedNode !== null && this.selectedEvent === null;
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	public get nodesList(): EventTreeNode[] {
		return sortEventsByTimestamp(this.eventTree, 'desc').flatMap(eventNode =>
			this.getNodesList(eventNode),
		);
	}

	public get selectedPath(): EventTreeNode[] {
		if (this.selectedNode == null) {
			return [];
		}
		return [
			...this.getNodesPath(getEventNodeParents(this.selectedNode), this.nodesList),
			this.selectedNode,
		];
	}

	public setHoveredEvent(event: EventTreeNode | null): void {
		if (event !== this.hoveredEvent) {
			this.hoveredEvent = event;
		}
	}

	public toggleNode = (eventTreeNode: EventTreeNode): void => {
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

	public selectNode = (eventTreeNode: EventTreeNode | null): void => {
		this.selectedNode = eventTreeNode;
		if (this.viewStore.eventsPanelArea === 100) {
			this.viewStore.eventsPanelArea = 50;
		}
	};

	public scrollToEvent = (eventId: string | null, parentEventIds: string[] = []): void => {
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

	private eventTreeAC: AbortController | null = null;

	private fetchEventTree = async () => {
		if (this.eventTreeAC) {
			this.eventTreeAC.abort();
		}
		this.eventTreeAC = new AbortController();
		this.eventTreeStatusCode = null;

		this.selectedNode = null;
		this.isLoadingRootEvents = true;

		try {
			const rootEventIds = await this.api.events.getEventTree(
				this.filterStore.filter,
				this.eventTreeAC.signal,
			);
			runInAction(() => {
				this.eventTree = sortEventsByTimestamp(rootEventIds);
			});
			this.isLoadingRootEvents = false;
		} catch (error) {
			if (error.name !== 'AbortError') {
				this.eventTreeStatusCode = error.status;
				this.eventTree = [];
				this.isExpandedMap.clear();
				console.error('Error while loading root events', error);
				this.isLoadingRootEvents = false;
			}
		} finally {
			this.eventTreeAC = null;
		}
	};

	public onEventSelect = async (savedEventNode: EventTreeNode | EventAction): Promise<void> => {
		this.graphStore.setTimestamp(timestampToNumber(savedEventNode.startTimestamp));
		this.workspaceStore.viewStore.activePanel = this;
		let fullPath: string[] = [];
		/*
			While we are saving eventTreeNodes with their parents, searching returns eventTreeNodes 
			without full path, so we have to fetch it first
			
		*/
		if (!savedEventNode.parents) {
			try {
				this.isLoadingRootEvents = true;
				this.selectNode(null);
				fullPath = await this.fetchFullPath(savedEventNode);
			} catch (error) {
				this.isLoadingRootEvents = false;
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
		await this.fetchEventTree();
		this.expandPath(fullPath);
		this.isLoadingRootEvents = false;
	};

	public onRangeChange = (timestamp: number): void => {
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

	private detailedEventAC: AbortController | null = null;

	private fetchDetailedEventInfo = async (selectedNode: EventTreeNode | null) => {
		this.selectedEvent = null;
		if (!selectedNode) return;

		this.detailedEventAC?.abort();
		this.detailedEventAC = new AbortController();

		this.loadingSelectedEvent = true;
		try {
			const event = await this.api.events.getEvent(
				selectedNode.eventId,
				this.detailedEventAC.signal,
			);
			this.selectedEvent = event;
		} catch (error) {
			console.error(`Error occurred while loading event ${selectedNode.eventId}`);
		} finally {
			this.loadingSelectedEvent = false;
		}
	};

	public expandPath = async (selectedIds: string[]): Promise<void> => {
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

	private onFilterChange = async () => {
		await this.fetchEventTree();
		this.isExpandedMap.clear();
	};

	private onSelectedNodeChange = (selectedNode: EventTreeNode | null) => {
		this.fetchDetailedEventInfo(selectedNode);
		this.selectedParentNode = null;
	};

	private onViewChange = () => {
		if (this.selectedNode) {
			this.scrollToEvent(this.selectedNode.eventId || null, this.selectedNode.parents);
		}
	};

	private onScrolledItemChange = (scrolledItemId: string | null) => {
		this.scrollToEvent(scrolledItemId);
	};

	private async init(initialState: EventStoreDefaultStateType) {
		if (!initialState) {
			this.fetchEventTree();
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
			await this.fetchEventTree();
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

	public isNodeSelected(eventTreeNode: EventTreeNode): boolean {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.eventId === eventTreeNode.eventId);
	}

	private getNodesList = (
		eventTreeNode: EventTreeNode,
		parents: string[] = [],
	): EventTreeNode[] => {
		// eslint-disable-next-line no-param-reassign
		eventTreeNode.parents = !eventTreeNode.parents ? parents : eventTreeNode.parents;
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
		// eslint-disable-next-line no-param-reassign
		eventTreeNode.parents = !eventTreeNode.parents ? parents : eventTreeNode.parents;
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
			getEventParentId(currentEvent) !== 'null'
		) {
			const parentId = getEventParentId(currentEvent);
			path.unshift(parentId);
			// eslint-disable-next-line no-await-in-loop
			currentEvent = await this.api.events.getEvent(parentId);
		}

		return path;
	};
}
