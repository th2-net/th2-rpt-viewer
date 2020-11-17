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

import { action, computed, observable, toJS, runInAction, reaction } from 'mobx';
import FilterStore from './FilterStore';
import ViewStore from './WindowViewStore';
import ApiSchema from '../api/ApiSchema';
import { EventAction, EventTree, EventTreeNode } from '../models/EventAction';
import SearchStore from './SearchStore';
import EventsFilter from '../models/filter/EventsFilter';
import PanelArea from '../util/PanelArea';
import { TabTypes } from '../models/util/Windows';
import { getEventNodeParents, sortEventsByTimestamp } from '../helpers/event';
import { SelectedStore } from './SelectedStore';

export type EventStoreURLState = Partial<{
	type: TabTypes.Events;
	panelArea: PanelArea;
	filter: EventsFilter;
	selectedNodesPath: string[];
	search: string[];
	flattenedListView: boolean;
	selectedParentId: string;
}>;

export default class EventsStore {
	constructor(
		private api: ApiSchema,
		private selectedStore: SelectedStore,
		initialState: EventsStore | EventStoreURLState | null,
	) {
		this.init(initialState);

		reaction(
			() => this.filterStore.eventsFilter,
			async () => {
				await this.fetchEventTree();
				this.isExpandedMap.clear();
			},
		);

		reaction(
			() => this.selectedNode,
			selectedNode => {
				this.fetchDetailedEventInfo(selectedNode);
				this.selectedParentNode = null;
			},
		);

		reaction(
			() => this.viewStore.flattenedListView,
			() => {
				if (this.selectedNode) {
					this.scrollToEvent(this.selectedNode.eventId || null, this.selectedNode.parents);
				}
			},
		);

		reaction(
			() => this.searchStore.scrolledItem,
			scrolledItemId => this.scrollToEvent(scrolledItemId),
		);
	}

	filterStore: FilterStore = new FilterStore();

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore(this.api, this);

	@observable.ref eventTree: EventTree = [];

	@observable eventsCache: Map<string, EventAction> = new Map();

	@observable isLoadingRootEvents = false;

	@observable.ref selectedNode: EventTreeNode | null = null;

	@observable.ref selectedParentNode: EventTreeNode | null = null;

	@observable.ref selectedEvent: EventAction | null = null;

	@observable loadingSelectedEvent = false;

	@observable scrolledIndex: Number | null = null;

	@observable isExpandedMap: Map<string, boolean> = new Map();

	@computed
	public get flattenedEventList() {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(
				eventNode => eventNode.childList.length === 0 && eventNode.filtered,
			),
		);
	}

	@computed
	public get flatExpandedList() {
		return this.eventTree.flatMap(eventId => this.getFlatExpandedList(eventId));
	}

	@computed
	public get color() {
		if (!this.selectedEvent) return undefined;
		return this.selectedStore.eventColors.get(this.selectedEvent.eventId);
	}

	@computed
	public get isSelectedEventLoading() {
		return this.selectedNode !== null && this.selectedEvent === null;
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed
	get nodesList() {
		return this.eventTree.flatMap(eventNode => this.getNodesList(eventNode));
	}

	@computed
	get selectedPath(): EventTreeNode[] {
		if (this.selectedNode == null) {
			return [];
		}
		return [
			...this.getNodesPath(getEventNodeParents(this.selectedNode), this.nodesList),
			this.selectedNode,
		];
	}

	@action
	toggleNode = (eventTreeNode: EventTreeNode) => {
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
	selectNode = (eventTreeNode: EventTreeNode | null) => {
		this.selectedNode = eventTreeNode;
		if (this.viewStore.panelArea === PanelArea.P100) {
			this.viewStore.panelArea = PanelArea.P50;
		}
	};

	@action
	scrollToEvent = (eventId: string | null, parentEventIds: string[] = []) => {
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

	@action
	fetchEvent = async (
		eventTreeNode: EventTreeNode,
		abortSignal?: AbortSignal,
	): Promise<EventAction> => {
		const { eventId } = eventTreeNode;
		const cachedEvent = this.eventsCache.get(eventId);
		if (cachedEvent) return cachedEvent;
		const event = await this.api.events.getEvent(eventId, abortSignal);

		runInAction(() => {
			this.eventsCache.set(eventId, event);
		});

		return event;
	};

	private eventTreeAC: AbortController | null = null;

	@action
	private fetchEventTree = async () => {
		if (this.eventTreeAC) {
			this.eventTreeAC.abort();
		}
		this.eventTreeAC = new AbortController();

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
		} catch (error) {
			this.eventTree = [];
			this.isExpandedMap.clear();
			console.error('Error while loading root events', error);
		} finally {
			this.eventTreeAC = null;
			this.isLoadingRootEvents = false;
		}
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
	private expandPath = async (selectedIds: string[]) => {
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
				...sortEventsByTimestamp(eventTreeNode.childList).flatMap(eventNode =>
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

	@action
	private copy(store: EventsStore) {
		this.eventsCache = toJS(store.eventsCache, { exportMapsAsObjects: false });
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
			isLoading: store.viewStore.isLoading.valueOf(),
			panelArea: store.viewStore.panelArea,
		});
		this.filterStore = new FilterStore(store.filterStore);
		this.searchStore = new SearchStore(this.api, this, {
			isLoading: store.searchStore.isLoading,
			rawResults: toJS(store.searchStore.rawResults),
			scrolledIndex: store.searchStore.scrolledIndex,
			tokens: toJS(store.searchStore.tokens),
		});
	}

	@action
	private async init(initialState: EventsStore | EventStoreURLState | null) {
		if (!initialState) {
			this.fetchEventTree();
			return;
		}

		if (initialState instanceof EventsStore) {
			this.copy(initialState);
			return;
		}

		const {
			filter,
			panelArea = PanelArea.P100,
			selectedNodesPath,
			search,
			flattenedListView,
			selectedParentId,
		} = initialState;
		this.viewStore.panelArea = panelArea;

		this.filterStore = new FilterStore({ eventsFilter: filter });
		this.searchStore = new SearchStore(this.api, this, { searchPatterns: search || [] });
		this.viewStore = new ViewStore({
			flattenedListView,
			panelArea,
		});
		await this.fetchEventTree();
		if (selectedNodesPath) {
			this.expandPath(selectedNodesPath);
		}
		if (selectedParentId) {
			const parentNode = this.selectedPath.find(
				eventNode => eventNode.eventId === selectedParentId,
			);
			this.selectedParentNode = parentNode ?? null;
		}
	}
}
