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

/* eslint-disable max-classes-per-file */
import { action, computed, observable, toJS } from 'mobx';
import { EventMessage } from 'models/EventMessage';
import { ActionType, EntityType, EventAction } from 'models/EventAction';
import EventsFilter from 'models/filter/EventsFilter';
import EventsFilterStore from 'modules/events/stores/EventsFilterStore';
import MessagesFilterStore from 'modules/messages/stores/MessagesFilterStore';
import MessagesFilter from 'models/filter/MessagesFilter';
import { timestampToNumber } from 'helpers/date';
import { SearchHistory } from './SearchStore';

interface SearchResultItem<I, F> {
	workspaceId: string;
	timestamp: number;
	type: EntityType;
	data: I[];
	startTimestamp: number;
	endTimestamp: number;
	filter: F;
	streams: string[];
	processedObjectsCount: number;
	currentTimestamp: number;
}

export type EventsSearchHistory = SearchResultItem<EventAction, EventsFilter>;
export type MessagesSearchHistory = SearchResultItem<EventMessage, MessagesFilter>;

export class SearchResult<T extends EventAction | EventMessage, F> {
	constructor({
		currentTimestamp,
		data,
		endTimestamp,
		filter,
		timestamp,
		processedObjectsCount,
		streams,
		startTimestamp,
		type,
		workspaceId,
	}: SearchResultItem<T, F>) {
		this.timestamp = timestamp;
		this.type = type;
		this.currentTimestamp = currentTimestamp;
		this.startTimestamp = startTimestamp;
		this.endTimestamp = endTimestamp;
		this.filter = filter;
		this.processedObjectsCount = processedObjectsCount;
		this.streams = streams;
		this.data = data;
		this.workspaceId = workspaceId;
	}

	public readonly workspaceId: string;

	@observable
	public timestamp: number;

	@observable
	public type: EntityType;

	@observable.ref
	public data: T[];

	@observable
	public startTimestamp: number;

	@observable
	public endTimestamp: number;

	@observable
	public filter: F;

	@observable
	public streams: string[];

	@observable
	public processedObjectsCount: number;

	@observable
	public currentTimestamp: number;

	@action
	public addData = (data: T[]) => {
		if (data.length > 0) {
			this.data = [...this.data, ...data];
		}
	};

	@computed
	public get count() {
		return this.data.length;
	}

	@action
	public onSearchEnd = () => {
		this.currentTimestamp = this.endTimestamp;
	};

	static fromFilterStore(
		filterStore: EventsFilterStore | MessagesFilterStore,
		workspaceId: string,
	) {
		if (filterStore instanceof MessagesFilterStore) {
			const { startTimestamp, endTimestamp, streams } = filterStore.params;
			const filter = filterStore.filter;
			if (startTimestamp && endTimestamp && filter) {
				return new MessagesSearchResult({
					workspaceId,
					startTimestamp,
					endTimestamp,
					currentTimestamp: startTimestamp,
					data: [],
					filter,
					timestamp: Date.now(),
					processedObjectsCount: 0,
					streams,
					type: ActionType.MESSAGE,
				});
			}
			return null;
		}
		const { startTimestamp: timestampFrom, endTimestamp: timestampTo, filter } = filterStore;

		if (timestampFrom && timestampTo && filter) {
			return new EventsSearchResult({
				workspaceId,
				startTimestamp: timestampFrom,
				endTimestamp: timestampTo,
				currentTimestamp: timestampFrom,
				data: [],
				filter,
				timestamp: Date.now(),
				processedObjectsCount: 0,
				streams: [],
				type: 'event',
			});
		}
		return null;
	}

	toJs = (): SearchResultItem<T, F> => ({
		workspaceId: this.workspaceId,
		startTimestamp: this.startTimestamp,
		endTimestamp: this.endTimestamp,
		currentTimestamp: this.currentTimestamp,
		data: toJS(this.data),
		filter: toJS(this.filter),
		timestamp: this.timestamp,
		processedObjectsCount: this.processedObjectsCount,
		streams: toJS(this.streams),
		type: this.type,
	});

	static isValidSearchHistory = (obj: unknown): obj is SearchHistory =>
		typeof obj === 'object' && obj !== null && 'data' in obj;
}

export class EventsSearchResult extends SearchResult<EventAction, EventsFilter> {
	constructor(state: SearchResultItem<EventAction, EventsFilter>) {
		super(state);
	}

	@action
	public addData = (data: EventAction[]) => {
		if (data.length > 0) {
			this.data = [...this.data, ...data];
			const lastEvent = data[data.length - 1];

			const lastTimestamp = timestampToNumber(lastEvent.startTimestamp);
			this.currentTimestamp = Math.max(lastTimestamp, this.currentTimestamp);
		}
	};
}

export class MessagesSearchResult extends SearchResult<EventMessage, MessagesFilter> {
	constructor(state: SearchResultItem<EventMessage, MessagesFilter>) {
		super(state);
	}

	@action
	public addData = (data: EventMessage[]) => {
		if (data.length > 0) {
			this.data = [...this.data, ...data];
			const lastEvent = data[data.length - 1];

			const lastTimestamp = timestampToNumber(lastEvent.timestamp);
			this.currentTimestamp = Math.max(lastTimestamp, this.currentTimestamp);
		}
	};
}
