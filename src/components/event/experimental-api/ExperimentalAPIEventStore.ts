import { useMemo, useEffect, useState } from 'react';
import { observable, runInAction, computed, action } from 'mobx';
import { EventAction } from '../../../models/EventAction';
import api from '../../../api';
import eventHttpApi from '../../../api/event';
import { isAbortError } from '../../../helpers/fetch';
import { useWorkspaceStore } from '../../../hooks';
import { isEventAction } from '../../../helpers/event';
import { EventStoreDefaultStateType } from '../../../stores/events/EventsStore';

export class ExperimentalAPIEventStore {
	private CHILDREN_COUNT_LIMIT = 20;

	@observable rootIds: string[] = [];

	@observable isExpanded: Map<string, boolean> = new Map();

	@observable cache: Map<string, EventAction> = new Map();

	@observable isLoadingRootIds = false;

	@observable parentsChildrenMap: Map<string, string[]> = new Map();

	@observable isLoadingChildren: Map<string, boolean> = new Map();

	@observable selectedEvent: EventAction | null = null;

	@observable hasMoreChildren: Map<string, boolean> = new Map();

	@observable scrolledIndex: null | Number = null;

	constructor(initialState: EventStoreDefaultStateType) {
		this.getRootIds();
		if (typeof initialState !== 'string') {
			if (typeof initialState?.selectedEventId === 'string')
				this.loadEvent(initialState.selectedEventId);
		}
	}

	@action
	loadEvent = async (eventId: string) => {
		const parents = await eventHttpApi.getEventParents(eventId);
		for (let i = 0; i < parents.length; i++) {
			this.cache.set(parents[i].eventId, parents[i]);
			if (parents[i].parentEventId) {
				this.parentsChildrenMap.set(parents[i].parentEventId, [parents[i].eventId]);
			}
			this.isExpanded.set(parents[i].parentEventId, true);
		}
		this.selectEvent(parents[parents.length - 1]);
		this.scrollToEvent(eventId);
	};

	@action
	selectEvent = (event: EventAction | null) => {
		this.selectedEvent = event;
		console.log(event);
	};

	@action
	scrollToEvent = (eventId: string) => {
		const index = this.tree.indexOf(eventId);

		if (index !== -1) {
			this.scrolledIndex = new Number(index);
		}
	};

	@computed get selectedPath(): EventAction[] {
		if (!this.selectedEvent) return [];

		let eventId = this.selectedEvent.eventId;
		const path: EventAction[] = [];
		while (eventId) {
			const event = this.cache.get(eventId);

			if (!event) break;
			path.unshift(event);
			eventId = event.parentEventId;
		}

		return path;
	}

	@computed get tree() {
		const getNodesList = (eventId: string): string[] => {
			if (this.isExpanded.get(eventId)) {
				const children = this.parentsChildrenMap.get(eventId) || [];
				return [eventId, ...children.flatMap(getNodesList)];
			}
			return [eventId];
		};

		return this.rootIds.flatMap(getNodesList);
	}

	getRootIds = async () => {
		runInAction(() => (this.isLoadingRootIds = true));
		try {
			const ids = await api.events.getChildrenIds({});
			runInAction(() => {
				this.rootIds = ids || [];
				this.isLoadingRootIds = false;
			});
		} catch (error) {
			runInAction(() => (this.isLoadingRootIds = false));
		}
	};

	fetchChildren = async (eventId: string) => {
		if (this.isLoadingChildren.get(eventId) || this.hasMoreChildren.get(eventId) === false) return;
		this.isLoadingChildren.set(eventId, true);
		const currentChildren = this.parentsChildrenMap.get(eventId) || [];

		try {
			const ids = await api.events.getChildrenIds({
				parentId: eventId,
				limit: this.CHILDREN_COUNT_LIMIT + 1,
				offset: this.parentsChildrenMap.get(eventId)?.length || 0,
			});

			runInAction(() => {
				this.hasMoreChildren.set(eventId, ids.length > this.CHILDREN_COUNT_LIMIT);
				this.isLoadingChildren.set(eventId, false);
				ids.splice(this.CHILDREN_COUNT_LIMIT, 1);
				this.parentsChildrenMap.set(eventId, [...currentChildren, ...ids]);
			});
		} catch (error) {
			runInAction(() => {
				this.isLoadingChildren.set(eventId, false);
				this.hasMoreChildren.set(eventId, false);
			});
			console.log(`Couldnt fetch child of event id ${eventId}`, error);
		}
	};

	@action
	toggleExpand = (eventId: string) => {
		this.isExpanded.set(eventId, !this.isExpanded.get(eventId));
	};

	fetchEvent = async (eventId: string, signal?: AbortSignal): Promise<EventAction> => {
		const cached = await this.cache.get(eventId);
		if (cached) return cached;

		const data = await api.events.getEvent(eventId, signal);
		this.cache.set(eventId, data);
		return data;
	};

	getParentNodes(eventId: string, cache: Map<string, EventAction>): EventAction[] {
		let event = cache.get(eventId);
		const path = [];

		while (event && event?.parentEventId !== null) {
			event = cache.get(event.parentEventId);
			path.unshift(event);
		}

		return path.filter(isEventAction);
	}

	getChildrenNodes(parentId: string): string[] {
		return this.parentsChildrenMap.get(parentId) || [];
	}
}

export const useExperimentalApiEventStore = () => {
	return useWorkspaceStore().experimentalAPIEventsStore;
};

export const useEvent = (eventId: string) => {
	const store = useExperimentalApiEventStore();

	const [event, setEvent] = useState(store.cache.get(eventId) || null);
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		if (event && event.eventId === eventId) return;
		const ac = new AbortController();
		setIsError(false);
		const fetchEvent = async () => {
			try {
				const data = await store.fetchEvent(eventId, ac.signal);
				setEvent(data);
			} catch (error) {
				if (!isAbortError(error)) {
					setIsError(true);
				}
			}
		};

		fetchEvent();
	}, [eventId]);

	return useMemo(() => ({ event, isError }), [event, isError]);
};
