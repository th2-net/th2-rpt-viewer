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
import { EventAction } from '../models/EventAction';
import SearchStore from './SearchStore';
import EventsFilter from '../models/filter/EventsFilter';
import PanelArea from '../util/PanelArea';
import WindowsStore from './WindowsStore';
import { TabTypes } from '../models/util/Windows';

export type EventIdNode = {
	id: string;
	isExpanded: boolean;
	children: EventIdNode[] | null;
	parents: string[];
};

export type EventStoreURLState = Partial<{
	type: TabTypes.Events;
	panelArea: PanelArea;
	filter: EventsFilter;
	selectedNodesPath: string[];
	search: string[];
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
			filter => this.fetchRootEvents(),
		);
	}

	filterStore: FilterStore = new FilterStore();

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore(this.api, this);

	@observable eventsIds: EventIdNode[] = [];

	@observable eventsCache: Map<string, EventAction> = new Map();

	@observable isLoadingRootEvents = false;

	@observable selectedNode: EventIdNode | null = null;

	// eslint-disable-next-line @typescript-eslint/ban-types
	@observable scrolledIndex: Number | null = null;

	@computed get color() {
		if (!this.selectedNode) return undefined;
		return this.windowsStore.eventColors.get(this.selectedNode.id);
	}

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed get nodesList() {
		return this.eventsIds.flatMap(eventId => this.getNodesList(eventId));
	}

	@computed get selectedPath(): EventIdNode[] {
		if (this.selectedNode == null) {
			return [];
		}

		return [...this.getNodesPath(this.selectedNode.parents, this.nodesList), this.selectedNode];
	}

	@computed get scrolledEventIndex(): number | null {
		if (this.searchStore.scrolledItem == null) {
			return null;
		}

		return this.nodesList.findIndex(node => node.id === this.searchStore.scrolledItem);
	}

	@action
	toggleNode = (idNode: EventIdNode) => {
		// eslint-disable-next-line no-param-reassign
		idNode.isExpanded = !idNode.isExpanded;
		const nodeIndex = this.nodesList.findIndex(node => node.id === idNode.id);
		this.nodesList[nodeIndex].isExpanded = idNode.isExpanded;
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
		this.windowsStore.lastSelectedEventId = idNode?.id || null;
		if (this.viewStore.panelArea === PanelArea.P100) {
			this.viewStore.panelArea = PanelArea.P50;
		}
	};

	@action
	scrollToEvent = (idNode: EventIdNode) => {
		const index = this.nodesList.indexOf(idNode);
		if (index !== -1) {
			this.scrolledIndex = new Number(index);
		}
	};

	@action
	fetchEvent = async (idNode: EventIdNode, abortSignal?: AbortSignal): Promise<EventAction> => {
		const { id } = idNode;
		const cachedEvent = this.eventsCache.get(id);
		if (cachedEvent) {
			if (!idNode.children) {
				this.fetchEventChildren(
					idNode,
					this.filterStore.eventsFilter.timestampFrom,
					this.filterStore.eventsFilter.timestampTo,
					abortSignal,
				);
			}
			return cachedEvent;
		}
		const event = await this.api.events.getEvent(id, abortSignal);
		runInAction(() => {
			this.eventsCache.set(idNode.id, event);
		});

		this.fetchEventChildren(
			idNode,
			this.filterStore.eventsFilter.timestampFrom,
			this.filterStore.eventsFilter.timestampTo,
			abortSignal,
		);

		return event;
	};

	@action
	fetchEventChildren = async (
		idNode: EventIdNode,
		timestampFrom: number,
		timestampTo: number,
		abortSignal?: AbortSignal,
	): Promise<string[] | null> => {
		try {
			const childrenIds = await this.api.events.getEventChildren(
				idNode.id,
				timestampFrom,
				timestampTo,
				abortSignal,
			);
			runInAction(() => {
				// eslint-disable-next-line no-param-reassign
				idNode.children = childrenIds.map(
					childId => this.createTreeNode(childId, [...idNode.parents, idNode.id]),
				);
			});

			return childrenIds;
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error(`could not fetch event children ${idNode.id}`);
			}

			return null;
		}
	};

	@action
	fetchRootEvents = async () => {
		this.selectedNode = null;
		this.isLoadingRootEvents = true;

		try {
			const rootEventIds = await this.api.events.getRootEvents(this.filterStore.eventsFilter);
			runInAction(() => {
				this.eventsIds = rootEventIds.map(eventId => this.createTreeNode(eventId));
			});
		} catch (error) {
			console.error('Error while loading root events', error);
		} finally {
			this.isLoadingRootEvents = false;
		}
	};

	@action.bound
	async expandBranch(selectedIds: string[]) {
		if (!selectedIds.length) return;
		let headNode: EventIdNode | undefined;
		let children = this.nodesList;

		for await (const eventId of selectedIds) {
			headNode = children.find(node => node.id === eventId);
			if (headNode) {
				await this.fetchEvent(headNode);
				await this.fetchEventChildren(
					headNode,
					this.filterStore.eventsFilter.timestampFrom,
					this.filterStore.eventsFilter.timestampTo,
				);
				// eslint-disable-next-line no-loop-func
				this.nodesList[this.nodesList.findIndex(node => node.id === headNode?.id)].children = headNode.children;
				if (!headNode.isExpanded) {
					this.toggleNode(headNode);
				}
			}
			children = headNode?.children || [];
		}
		runInAction(() => {
			if (headNode) {
				this.selectNode(headNode);
				this.scrollToEvent(headNode);
			}
		});
	}

	@computed
	get selectedEvent() {
		if (!this.selectedNode) return null;
		const event = this.eventsCache.get(this.selectedNode.id);
		return event || null;
	}

	isNodeSelected(idNode: EventIdNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.some(n => n.id === idNode.id);
	}

	private createTreeNode(id: string, parents: string[] = [], children: EventIdNode[] | null = null): EventIdNode {
		const node: EventIdNode = {
			id,
			isExpanded: false,
			children,
			parents,
		};

		return node;
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

		const selectedNode = store.selectedNode;

		if (selectedNode) {
			const scrolledIndex = store.nodesList.findIndex(idNode => idNode.id === selectedNode.id);
			this.scrolledIndex = scrolledIndex === -1 ? null : new Number(scrolledIndex);
		}

		this.viewStore = new ViewStore(store.viewStore);
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
			this.fetchRootEvents();
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
		} = initialState;
		this.viewStore.panelArea = panelArea;

		this.filterStore = new FilterStore({ eventsFilter: filter });
		this.searchStore = new SearchStore(this.api, this, { searchPatterns: search || [] });
		await this.fetchRootEvents();
		if (selectedNodesPath && selectedNodesPath.length) {
			this.expandBranch(selectedNodesPath);
		}
	}
}
