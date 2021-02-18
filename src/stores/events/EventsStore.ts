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

import { action, computed, observable, reaction, runInAction, toJS } from 'mobx';
import moment from 'moment';
import FilterStore from '../FilterStore';
import ViewStore from '../workspace/WorkspaceViewStore';
import ApiSchema from '../../api/ApiSchema';
import { EventAction, EventTree, EventTreeNode } from '../../models/EventAction';
import EventsSearchStore from './EventsSearchStore';
import EventsFilter from '../../models/filter/EventsFilter';
import { TabTypes } from '../../models/util/Windows';
import {
	getEventNodeParents,
	isEventAction,
	isEventNode,
	sortEventsByTimestamp,
} from '../../helpers/event';
import WorkspaceStore from '../workspace/WorkspaceStore';
import { getTimestampAsNumber } from '../../helpers/date';
import { calculateTimeRange } from '../../helpers/graph';
import { isEventsStore } from '../../helpers/stores';
import { GraphStore } from '../GraphStore';
import { TimeRange } from '../../models/Timestamp';
import { SearchStore } from '../SearchStore';

export type EventStoreURLState = Partial<{
	type: TabTypes.Events;
	panelArea: number;
	filter: EventsFilter;
	selectedNodesPath: string[];
	search: string[];
	flattenedListView: boolean;
	selectedParentId: string;
}>;

export type EventStoreDefaultStateType = EventsStore | EventStoreURLState | null;

export default class EventsStore {
	filterStore = new FilterStore(this.searchPanelStore);

	viewStore = new ViewStore();

	searchStore = new EventsSearchStore(this.api, this);

	constructor(
		private workspaceStore: WorkspaceStore,
		private graphStore: GraphStore,
		private searchPanelStore: SearchStore,
		private api: ApiSchema,
		initialState: EventStoreDefaultStateType | EventAction | EventTreeNode,
	) {
		this.init(initialState);

		reaction(() => this.filterStore.eventsFilter, this.onFilterChange);

		reaction(() => this.selectedNode, this.onSelectedNodeChange);

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.searchStore.scrolledItem, this.onScrolledItemChange);
	}

	@observable.ref eventTree: EventTree = [];

	@observable isLoadingRootEvents = false;

	@observable.ref selectedNode: EventTreeNode | null = null;

	@observable.ref selectedParentNode: EventTreeNode | null = null;

	@observable.ref selectedEvent: EventAction | null = null;

	@observable loadingSelectedEvent = false;

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
		return [this.filterStore.eventsFilter.timestampFrom, this.filterStore.eventsFilter.timestampTo];
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
				runInAction(() => {
					const eventIndex = this.nodesList.findIndex(ev => ev.eventId === id);
					if (eventIndex !== -1 && id !== eventId) this.isExpandedMap.set(id, true);
					if (id === eventId) this.scrolledIndex = eventIndex;
				});
			});
		} else {
			index = this.flattenedEventList.findIndex(event => event.eventId === eventId);
			this.scrolledIndex = index !== -1 ? new Number(index) : null;
		}
	};

	private eventTreeAC: AbortController | null = null;

	@action
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
				this.filterStore.eventsFilter,
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

	@action
	public onEventSelect = async (savedEventNode: EventTreeNode | EventAction) => {
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
			getTimestampAsNumber(savedEventNode.startTimestamp),
			this.graphStore.interval,
		);

		this.filterStore.eventsFilter.timestampFrom = timestampFrom;
		this.filterStore.eventsFilter.timestampTo = timestampTo;
		this.filterStore.eventsFilter.eventTypes = [];
		this.filterStore.eventsFilter.names = [];

		await this.fetchEventTree();
		this.expandPath(fullPath);
		this.isLoadingRootEvents = false;
	};

	@action
	public onRangeChange = (timestamp: number) => {
		this.filterStore.eventsFilter = {
			...this.filterStore.eventsFilter,
			timestampFrom: moment(timestamp)
				.subtract((this.graphStore.interval * 60) / 2, 'seconds')
				.valueOf(),
			timestampTo: moment(timestamp)
				.add((this.graphStore.interval * 60) / 2, 'seconds')
				.valueOf(),
		};
	};

	private detailedEventAC: AbortController | null = null;

	@action
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
			this.scrollToEvent(headNode.eventId, getEventNodeParents(headNode));
		}
	};

	@action
	private onFilterChange = async () => {
		await this.fetchEventTree();
		this.isExpandedMap.clear();
	};

	@action
	private onSelectedNodeChange = (selectedNode: EventTreeNode | null) => {
		this.fetchDetailedEventInfo(selectedNode);
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
	private copy(store: EventsStore) {
		this.isLoadingRootEvents = toJS(store.isLoadingRootEvents);
		this.selectedNode = store.selectedNode;
		this.eventTree = store.eventTree;
		this.selectedEvent = store.selectedEvent;
		this.selectedParentNode = store.selectedParentNode;
		this.scrolledIndex = store.scrolledIndex?.valueOf() || null;
		this.isExpandedMap = toJS(store.isExpandedMap, { exportMapsAsObjects: false });
		this.expandPath(store.selectedPath.map(n => n.eventId));
		this.viewStore = new ViewStore({
			flattenedListView: store.viewStore.flattenedListView.valueOf(),
			panelArea: store.viewStore.eventsPanelArea,
		});
		this.filterStore = new FilterStore(this.searchPanelStore, store.filterStore);
		this.searchStore = new EventsSearchStore(this.api, this, {
			isLoading: store.searchStore.isLoading,
			rawResults: toJS(store.searchStore.rawResults),
			scrolledIndex: store.searchStore.scrolledIndex,
			tokens: toJS(store.searchStore.tokens),
		});
	}

	@action
	private async init(
		initialState: EventsStore | EventStoreURLState | EventTreeNode | EventAction | null,
	) {
		const isInitialEntity = (state: typeof initialState): state is EventAction | EventTreeNode =>
			isEventAction(state) || isEventNode(state);

		if (!initialState) {
			this.fetchEventTree();
			return;
		}

		if (isEventsStore(initialState)) {
			this.copy(initialState);
			return;
		}

		this.viewStore.eventsPanelArea = isInitialEntity(initialState)
			? 100
			: initialState.panelArea || 100;

		this.filterStore = new FilterStore(this.searchPanelStore, {
			eventsFilter: !isInitialEntity(initialState) ? initialState.filter : undefined,
		});
		this.searchStore = new EventsSearchStore(this.api, this, {
			searchPatterns: !isInitialEntity(initialState) ? initialState.search : [],
		});
		this.viewStore = new ViewStore({
			flattenedListView: !isInitialEntity(initialState)
				? initialState.flattenedListView
				: undefined,
			panelArea: !isInitialEntity(initialState) ? initialState.panelArea : undefined,
		});

		if (isInitialEntity(initialState)) {
			this.onEventSelect(initialState);
		} else {
			await this.fetchEventTree();
		}

		if (!isInitialEntity(initialState) && initialState.selectedNodesPath) {
			this.expandPath(initialState.selectedNodesPath);
		}

		if (!isInitialEntity(initialState) && initialState.selectedParentId) {
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

	public dispose = () => {
		this.filterStore.dispose();
	};
}

const getEventParentId = (event: EventTreeNode | EventAction) =>
	isEventNode(event) ? event.parentId : event.parentEventId;
