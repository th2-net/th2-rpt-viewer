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
import { FilterEntry } from 'modules/search/stores/SearchStore';
import { IEventsStore, IFilterConfigStore } from 'models/Stores';
import { Panel } from 'models/Panel';
import EventsFilter from 'models/filter/EventsFilter';
import EventsFilterStore from './EventsFilterStore';
import ViewStore from '../../../stores/workspace/WorkspaceViewStore';
import ApiSchema from '../../../api/ApiSchema';
import { EventAction, EventTreeNode } from '../../../models/EventAction';
import EventsSearchStore from './EventsSearchStore';
import { isEvent, isEventNode, isRootEvent, sortEventsByTimestamp } from '../../../helpers/event';
import WorkspaceStore from '../../../stores/workspace/WorkspaceStore';
import { getRangeFromTimestamp, timestampToNumber } from '../../../helpers/date';
import { calculateTimeRange } from '../helpers/calculateTimeRange';
import { TimeRange } from '../../../models/Timestamp';
import EventsDataStore from './EventsDataStore';

export type EventStoreURLState = Partial<{
	panelArea: number;
	filter: Partial<EventsFilter>;
	range: TimeRange;
	selectedEventId: string;
	search: string[];
	flattenedListView: boolean;
	interval: number;
}>;

type EventStoreDefaultState = EventStoreURLState & {
	targetEvent?: EventTreeNode | EventAction;
	targetEventBodyRange?: FilterEntry | undefined;
};

export type EventStoreDefaultStateType = EventStoreDefaultState | string | null | undefined;

export default class EventsStore implements IEventsStore {
	public filterStore: EventsFilterStore;

	public viewStore: ViewStore;

	public searchStore: EventsSearchStore;

	public eventDataStore: EventsDataStore;

	constructor(
		private workspaceStore: WorkspaceStore,
		private filterConfigStore: IFilterConfigStore,
		private api: ApiSchema,
		defaultState: EventStoreDefaultStateType,
	) {
		const initialState = !defaultState || typeof defaultState === 'string' ? {} : defaultState;

		this.filterStore = new EventsFilterStore(this.filterConfigStore, {
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

		reaction(() => this.viewStore.flattenedListView, this.onViewChange);

		reaction(() => this.filterStore.interval, this.onIntervalChange);
	}

	@observable.ref
	public selectedNode: EventTreeNode | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public isExpandedMap: Map<string, boolean> = new Map();

	@observable
	public eventTreeStatusCode: number | null = null;

	@observable
	public targetNodeId: string | null = null;

	@observable
	public selectedBodyFilter: FilterEntry | null = null;

	@observable
	public renderedEvents: EventTreeNode[] = [];

	@action
	public setRenderedItems = (renderedEvents: EventTreeNode[]) => {
		this.renderedEvents = renderedEvents;
	};

	@computed
	public get isLoadingTargetNode(): boolean {
		return this.targetNodeId !== null;
	}

	@computed
	public get urlState(): EventStoreURLState {
		return {
			filter: this.filterStore.filter || undefined,
			range: this.filterStore.range,
			panelArea: this.viewStore.eventsPanelArea,
			search:
				this.searchStore.tokens.length > 0
					? this.searchStore.tokens.map(t => t.pattern)
					: undefined,
			selectedEventId: this.selectedNode?.eventId,
			flattenedListView: this.viewStore.flattenedListView,
			interval: this.filterStore.interval,
		};
	}

	@computed
	public get flattenedEventList() {
		return sortEventsByTimestamp(
			this.flatExpandedList.filter(eventNode => {
				const children = this.eventDataStore.parentChildrensMap.get(eventNode.eventId);
				return !children || children.length === 0;
			}),
		);
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
		return rootNodes.flatMap(eventNode => this.getFlatExpandedList(eventNode));
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
			startTimestamp: firstKnownEvent.startTimestamp,
			endEventId: firstKnownEvent.eventId,
			endTimestamp: firstKnownEvent.startTimestamp,
		};

		const eventNodes = this.getNodesList(firstKnownEvent, []);

		if (eventNodes.length > 1 && eventNodes[1]) {
			timestamps.startTimestamp = eventNodes[1].startTimestamp;
			timestamps.endTimestamp = timestamps.startTimestamp;

			for (let i = 1; eventNodes[i]; i++) {
				timestamps.endEventId = eventNodes[i].eventId;
				const parents = this.getParentNodes(eventNodes[i].eventId, this.eventDataStore.eventsCache);
				if (parents?.length === 1) {
					const eventTimestamp = eventNodes[i].startTimestamp;

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
	public toggleNode = (eventTreeNode: EventTreeNode) => {
		const isExpanded = !this.isExpandedMap.get(eventTreeNode.eventId);
		this.isExpandedMap.set(eventTreeNode.eventId, isExpanded);
	};

	@action
	public selectNode = (eventTreeNode: EventTreeNode | null) => {
		if (eventTreeNode?.isUnknown || eventTreeNode?.eventId === this.selectedNode?.eventId) {
			return;
		}
		this.selectedNode = eventTreeNode;
		if (eventTreeNode && this.viewStore.eventsPanelArea > 80) {
			this.viewStore.setPanelArea(50);
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
		this.workspaceStore.viewStore.activePanel = Panel.Events;

		const timeRange = calculateTimeRange(
			timestampToNumber(savedEventNode.startTimestamp),
			this.filterStore.interval,
		);
		this.eventDataStore.fetchEventTree({
			timeRange,
			filter: this.filterStore.filter,
			targetEventId: savedEventNode.eventId,
		});
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
	private onViewChange = () => {
		if (this.selectedNode) {
			this.scrollToEvent(this.selectedNode.eventId);
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
				this.filterStore.setRange(
					getRangeFromTimestamp(timestampToNumber(event.startTimestamp), this.filterStore.interval),
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
			if (defaultState?.targetEventBodyRange) {
				this.selectedBodyFilter = defaultState.targetEventBodyRange;
			}
			this.goToEvent(initialState.targetEvent);
		} else {
			this.eventDataStore.fetchEventTree({
				filter: this.filterStore.filter,
				timeRange: this.filterStore.range,
				targetEventId: initialState.selectedEventId,
			});
		}
	};

	private onIntervalChange = (interval: number) => {
		const intervalMs = interval * 60 * 1000;
		let timestampFrom = this.filterStore.timestampFrom;
		let timestampTo = this.filterStore.timestampFrom + intervalMs;
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
	): EventTreeNode[] => {
		const childList = this.getChildrenNodes(eventTreeNode.eventId);
		return [
			eventTreeNode,
			...childList.flatMap(node =>
				this.getFlatExpandedList(node, [...parents, eventTreeNode.eventId]),
			),
		];
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

	public applyFilter = (filter = this.filterStore.filter, timeRange = this.filterStore.range) => {
		this.eventDataStore.fetchEventTree({ filter, timeRange });
	};

	public clearFilter = () => {
		const defaultFilter = this.filterStore.getDefaultEventFilter();
		this.eventDataStore.fetchEventTree({
			filter: defaultFilter,
			timeRange: this.filterStore.range,
		});
	};

	public changeEventsRange = (minutesOffset: number) => {
		const timestampFrom = moment
			.utc(this.filterStore.timestampFrom)
			.add(minutesOffset, 'minutes')
			.valueOf();
		const timestampTo = moment
			.utc(timestampFrom)
			.add(this.filterStore.interval, 'minutes')
			.valueOf();

		this.eventDataStore.fetchEventTree({
			timeRange: [timestampFrom, timestampTo],
			filter: this.filterStore.filter,
		});
	};
}
