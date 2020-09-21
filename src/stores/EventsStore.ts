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

import {
	action, computed, observable, toJS, runInAction, reaction,
} from 'mobx';
import FilterStore from './FilterStore';
import ViewStore from './WindowViewStore';
import ApiSchema from '../api/ApiSchema';
import { EventAction, EventTreeNode } from '../models/EventAction';
import SearchStore from './SearchStore';
import EventsFilter from '../models/filter/EventsFilter';
import PanelArea from '../util/PanelArea';
import WindowsStore from './WindowsStore';
import { TabTypes } from '../models/util/Windows';
import { getTimestampAsNumber } from '../helpers/date';

export type EventIdNode = {
	id: string;
	isExpanded: boolean;
	children: EventIdNode[];
	parents: string[];
	event: EventTreeNode;
};

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
		private windowsStore: WindowsStore,
		initialState: EventsStore | EventStoreURLState | null,
	) {
		this.init(initialState);

		reaction(
			() => this.filterStore.eventsFilter,
			() => this.fetchEventTree(),
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
			() => this.scrollToEvent(this.selectedNode?.id || null, this.selectedNode?.parents),
		);

		reaction(
			() => this.searchStore.scrolledItem,
			scrolledItemId => this.scrollToEvent(scrolledItemId),
		);
	}

	filterStore: FilterStore = new FilterStore();

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore(this.api, this);

	@observable eventsIds: EventIdNode[] = [];

	@observable eventsCache: Map<string, EventAction> = new Map();

	@observable isLoadingRootEvents = false;

	@observable selectedNode: EventIdNode | null = null;

	@observable selectedParentNode: EventIdNode | null = null;

	@observable selectedEvent: EventAction | null = null;

	@observable loadingSelectedEvent = false;

	// eslint-disable-next-line @typescript-eslint/ban-types
	@observable scrolledIndex: Number | null = null;

	@computed
	public get flattenedEventList() {
		return this.flatExpandedList.filter(eventNode => eventNode.children.length === 0 && eventNode.event.filtered);
	}

	@computed
	public get flatExpandedList() {
		return this.eventsIds.flatMap(eventId => this.getFlatExpandedList(eventId));
	}

	@computed
	public get color() {
		if (!this.selectedEvent) return undefined;
		return this.windowsStore.eventColors.get(this.selectedEvent.eventId);
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed
	get nodesList() {
		return this.eventsIds.flatMap(eventId => this.getNodesList(eventId));
	}

	@computed
	get selectedPath(): EventIdNode[] {
		if (this.selectedNode == null) {
			return [];
		}

		return [...this.getNodesPath(this.selectedNode.parents, this.nodesList), this.selectedNode];
	}

	@action
	toggleNode = (idNode: EventIdNode) => {
		// eslint-disable-next-line no-param-reassign
		idNode.isExpanded = !idNode.isExpanded;
		if (idNode.isExpanded) {
			this.searchStore.appendResultsForEvent(idNode.id);
		} else if (idNode.children?.length) {
			this.searchStore.removeEventsResults(
				idNode.children.flatMap(this.getNodesList).map(node => node.id),
			);
		}
	};

	@action
	selectNode = (idNode: EventIdNode | null) => {
		this.selectedNode = idNode;
		this.windowsStore.lastSelectEventIdNode = idNode;
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
				const eventIndex = this.nodesList.findIndex(ev => ev.id === id);
				runInAction(() => {
					if (eventIndex !== -1) {
						this.nodesList[eventIndex].isExpanded = true;
						if (id === eventId) {
							this.scrolledIndex = eventIndex;
						}
					}
				});
			});
		} else {
			index = this.flattenedEventList.findIndex(event => event.id === eventId);
			this.scrolledIndex = index !== -1 ? new Number(index) : null;
		}
	};

	@action
	fetchEvent = async (idNode: EventIdNode, abortSignal?: AbortSignal): Promise<EventAction> => {
		const { id } = idNode;
		const cachedEvent = this.eventsCache.get(id);
		if (cachedEvent) return cachedEvent;
		const event = await this.api.events.getEvent(id, abortSignal);

		runInAction(() => {
			this.eventsCache.set(id, event);
		});

		return event;
	};

	@action
	private fetchEventTree = async () => {
		this.selectedNode = null;
		this.isLoadingRootEvents = true;
		try {
			const rootEventIds = await this.api.events.getEventTree(this.filterStore.eventsFilter);
			rootEventIds.sort((eventA, eventB) =>
				getTimestampAsNumber(eventB.startTimestamp) - getTimestampAsNumber(eventA.startTimestamp));
			runInAction(() => {
				this.eventsIds = rootEventIds.map(event => this.createEventTreeNode(event));
			});
		} catch (error) {
			console.error('Error while loading root events', error);
		} finally {
			this.isLoadingRootEvents = false;
		}
	};

	@action
	private fetchDetailedEventInfo = async (selectedNode: EventIdNode | null) => {
		this.selectedEvent = null;
		if (!selectedNode) return;

		this.loadingSelectedEvent = true;
		try {
			const event = await this.api.events.getEvent(selectedNode.id);
			this.selectedEvent = event;
			if (this.windowsStore.lastSelectEventIdNode === this.selectedNode) {
				this.windowsStore.lastSelectedEvent = event;
			}
		} catch (error) {
			console.error(`Error occurred while loading event ${selectedNode.id}`);
		} finally {
			this.loadingSelectedEvent = false;
		}
	};

	@action
	private expandBranch = async (selectedIds: string[]) => {
		if (selectedIds.length === 0) return;

		let headNode: EventIdNode | undefined;
		let children = this.nodesList;

		for (const eventId of selectedIds) {
			headNode = children.find(node => node.id === eventId);
			if (headNode && !headNode.isExpanded) {
				this.toggleNode(headNode);
			}
			children = headNode?.children || [];
		}
		if (headNode) {
			this.selectNode(headNode);
			this.scrollToEvent(headNode?.id || null, headNode.parents);
		}
	};

	isNodeSelected(idNode: EventIdNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.id === idNode.id);
	}

	private createEventTreeNode(
		event: EventTreeNode,
		parents: string[] = [],
	): EventIdNode {
		return {
			id: event.eventId,
			isExpanded: false,
			children: event.childList.map(childEvent =>
				this.createEventTreeNode(childEvent, [...parents, event.eventId])),
			parents,
			event,
		};
	}

	private getNodesList = (idNode: EventIdNode): EventIdNode[] => {
		if (idNode.isExpanded && idNode.children) {
			return [
				idNode,
				...idNode.children.flatMap(this.getNodesList),
			];
		}

		return [idNode];
	};

	private getFlatExpandedList = (idNode: EventIdNode): EventIdNode[] => [
		idNode,
		...idNode.children.flatMap(this.getFlatExpandedList),
	];

	private getNodesPath(path: string[], nodes: EventIdNode[]): EventIdNode[] {
		if (path.length === 0 || nodes.length === 0) {
			return [];
		}

		const [currentId, ...rest] = path;
		const targetNode = nodes.find(n => n.id === currentId)!;

		return [
			targetNode,
			...this.getNodesPath(rest, targetNode.children ?? []),
		];
	}

	@action
	private copy(store: EventsStore) {
		this.eventsCache = toJS(store.eventsCache, { exportMapsAsObjects: false });
		this.isLoadingRootEvents = toJS(store.isLoadingRootEvents);
		this.selectedNode = toJS(store.selectedNode);
		this.eventsIds = toJS(store.eventsIds);
		this.selectedEvent = toJS(store.selectedEvent);
		this.selectedParentNode = toJS(store.selectedParentNode);

		const selectedNode = store.selectedNode;

		if (selectedNode) {
			const scrolledIndex = store.nodesList.findIndex(idNode => idNode.id === selectedNode.id);
			this.scrolledIndex = scrolledIndex === -1 ? null : new Number(scrolledIndex);
		}

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
			this.expandBranch(selectedNodesPath);
		}
		if (selectedParentId) {
			const parentNode = this.selectedPath.find(eventNode => eventNode.id === selectedParentId);
			this.selectedParentNode = parentNode ?? null;
		}
	}
}
