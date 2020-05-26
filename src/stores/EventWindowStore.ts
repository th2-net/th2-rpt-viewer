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
	action, computed, observable, reaction,
} from 'mobx';
import FilterStore from './FilterStore';
import MessagesStore from './MessagesStore';
import ViewStore from './WindowViewStore';
import ApiSchema from '../api/ApiSchema';
import { EventAction } from '../models/EventAction';
import { nextCyclicItem, prevCyclicItem } from '../helpers/array';
import { getTimestampAsNumber } from '../helpers/date';
import SearchStore from './SearchStore';

export type EventIdNode = {
	id: string;
	isExpanded: boolean;
	children: EventIdNode[] | null;
	parents: EventIdNode[];
};

export default class EventWindowStore {
	filterStore: FilterStore = new FilterStore();

	messagesStore: MessagesStore = new MessagesStore(
		this.api,
		this.filterStore,
	);

	viewStore: ViewStore = new ViewStore();

	searchStore: SearchStore = new SearchStore();

	constructor(private api: ApiSchema) {
		reaction(
			() => this.rootEventSubEvents,
			this.onEventsListChange,
		);
	}

	@observable eventsIds: EventIdNode[] = [];

	@observable eventsCache: Map<string, EventAction> = new Map();

	@observable isLoadingRootEvents = false;

	@observable selectedNode: EventIdNode | null = null;

	createTreeNode = (id: string, parents: EventIdNode[] = []): EventIdNode => ({
		id,
		isExpanded: false,
		children: null,
		parents,
	});

	getNodesList = (idNode: EventIdNode): EventIdNode[] => {
		if (idNode.isExpanded && idNode.children) {
			return [
				idNode,
				...idNode.children.flatMap(this.getNodesList),
			];
		}

		return [idNode];
	};

	// we need this property for correct virtualized tree render -
	// to get event key by index in tree and list length calculation.
	@computed get nodesList() {
		return this.eventsIds.flatMap(eventId => this.getNodesList(eventId));
	}

	@computed get selectedPath() {
		if (this.selectedNode == null) {
			return [];
		}

		return [...this.selectedNode.parents, this.selectedNode];
	}

	@computed get selectedRootEvent(): EventAction | null {
		if (this.selectedNode == null) {
			return null;
		}

		const selectedRootNode = this.selectedPath[0];
		return this.eventsCache.get(selectedRootNode.id) ?? null;
	}

	@computed get rootEventSubEvents() {
		return this.selectedRootEvent?.subNodes || null;
	}

	@action
	toggleNode = (idNode: EventIdNode) => {
		// eslint-disable-next-line no-param-reassign
		idNode.isExpanded = !idNode.isExpanded;
	};

	@action
	selectNode = async (idNode: EventIdNode | null) => {
		if (idNode != null && idNode.children == null) {
			await this.fetchEventChildren(idNode);
		}

		this.selectedNode = idNode;
	};

	@action
	fetchEvent = async (id: string, abortSignal?: AbortSignal): Promise<EventAction> => {
		if (this.eventsCache.has(id)) {
			return this.eventsCache.get(id)!;
		}

		const event = await this.api.events.getEvent(id, abortSignal);
		this.eventsCache.set(id, event);
		return event;
	};

	@action
	fetchEventChildren = async (idNode: EventIdNode): Promise<string[]> => {
		const { id } = idNode;
		const subNodes = await this.api.events.getSubNodesIds(id);

		// eslint-disable-next-line no-param-reassign
		idNode.children = subNodes.map(subNodeId => this.createTreeNode(subNodeId, [...idNode.parents, idNode]));
		return subNodes;
	};

	@action
	fetchRootEvents = async () => {
		this.isLoadingRootEvents = true;
		try {
			const events = await this.api.events.getAll();
			this.isLoadingRootEvents = false;
			events.sort((a, b) => getTimestampAsNumber(b.startTimestamp) - getTimestampAsNumber(a.startTimestamp));

			this.eventsIds = events
				.map(event => this.createTreeNode(event.eventId, []));

			events.forEach(event => {
				this.eventsCache.set(event.eventId, event);
			});
		} catch (error) {
			console.error('Error while loading events', error);
		}
	};

	@action
	selectNextEvent = () => {
		if (!this.selectedRootEvent) return;
		const nextNode = nextCyclicItem(this.eventsIds, this.selectedNode);
		if (nextNode) {
			this.selectedNode = nextNode;
		}
	};

	@action
	selectPrevEvent = () => {
		if (!this.selectedRootEvent) return;
		const prevNode = prevCyclicItem(this.eventsIds, this.selectedNode);
		if (prevNode) {
			this.selectedNode = prevNode;
		}
	};

	@computed
	get selectedEvent() {
		if (!this.selectedNode) return null;
		const { id } = this.selectedNode;
		const event = this.eventsCache.get(id);
		return event || null;
	}

	public isNodeSelected(idNode: EventIdNode) {
		if (this.selectedNode == null) {
			return false;
		}

		return this.selectedPath.includes(idNode);
	}

	private onEventsListChange = (rootEventSubEvents: EventAction[] | null) => {
		if (!rootEventSubEvents || !rootEventSubEvents.length) return;
		const timestamps = rootEventSubEvents
			.map(event => getTimestampAsNumber(event.startTimestamp))
			.sort();
		const fromTimestamp = timestamps[0];
		const toTimestamp = timestamps[timestamps.length - 1];

		this.filterStore.setMessagesFromTimestamp(fromTimestamp);
		this.filterStore.setMessagesToTimestamp(toTimestamp);
	};
}
