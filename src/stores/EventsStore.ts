/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
	action, computed, observable, toJS, reaction,
} from 'mobx';
import FilterStore from './FilterStore';
import ViewStore from './WindowViewStore';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import SearchStore from './SearchStore';
import EventsFilter from '../models/filter/EventsFilter';

export type EventIdNode = {
	id: string;
	isExpanded: boolean;
	children: EventIdNode[] | null;
	parents: string[];
};

export default class EventsStore {
	filterStore: FilterStore = new FilterStore();

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore(this.api, this);

	// eslint-disable-next-line no-useless-constructor
	constructor(private api: ApiSchema, public color: string) {
		reaction(
			() => this.filterStore.eventsFilter,
			filter => this.fetchRootEvents(filter),
		);
	}

	@observable eventsIds: EventIdNode[] = [];

	@observable eventsCache: Map<string, EventAction> = new Map();

	@observable isLoadingRootEvents = false;

	@observable selectedNode: EventIdNode | null = null;

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
		if (idNode.isExpanded) {
			this.searchStore.appendResultsForEvent(idNode.id);
		} else if (idNode.children?.length) {
			this.searchStore.removeEventsResults(
				idNode.children.flatMap(this.getNodesList).map(node => node.id),
			);
		}
	};

	@action
	selectNode = async (idNode: EventIdNode | null) => {
		this.selectedNode = idNode;
	};

	@action
	fetchEvent = async (idNode: EventIdNode, abortSignal?: AbortSignal): Promise<EventAction> => {
		const { id, parents } = idNode;
		let event = this.eventsCache.get(id);
		if (event) return event;

		event = await this.api.events.getEvent(id, parents, abortSignal);
		this.eventsCache.set(event.eventId, event);
		// eslint-disable-next-line no-param-reassign
		idNode.children = event.childrenIds.map(
			childId => this.createTreeNode(childId, [...idNode.parents, idNode.id]),
		);
		return event;
	};

	@action
	fetchRootEvents = async (filter?: EventsFilter) => {
		this.selectedNode = null;
		this.isLoadingRootEvents = true;

		const events = await this.api.events.getRootEvents(filter);
		this.eventsIds = events.map(eventId => this.createTreeNode(eventId));

		this.isLoadingRootEvents = false;
	};

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

		if (this.eventsCache.has(id) && children == null) {
			const cachedChildren = this.eventsCache.get(id)!.childrenIds
				.map(childId => this.createTreeNode(childId, [...parents, id]));
			node.children = cachedChildren;
		}

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

	static copy(store: EventsStore, api: ApiSchema, color: string) {
		const copy = new EventsStore(api, color);

		copy.eventsCache = toJS(store.eventsCache, { exportMapsAsObjects: false });
		copy.isLoadingRootEvents = toJS(store.isLoadingRootEvents);
		copy.selectedNode = toJS(store.selectedNode);
		copy.eventsIds = toJS(store.eventsIds);
		copy.viewStore = ViewStore.copy(store.viewStore);
		copy.filterStore = FilterStore.copy(store.filterStore);
		copy.searchStore = SearchStore.copy(store.searchStore, api, copy);

		return copy;
	}
}
