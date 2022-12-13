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

import { action, computed, observable, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import ApiSchema from '../api/ApiSchema';
import WorkspacesStore, { WorkspacesUrlState } from './workspace/WorkspacesStore';
import notificationStoreInstance from './NotificationsStore';
import EventsStore, { EventStoreURLState } from './events/EventsStore';
import MessagesStore, { MessagesStoreURLState } from './messages/MessagesStore';
import { getObjectKeys } from '../helpers/object';
import { isWorkspaceStore } from '../helpers/workspace';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';
import MessageBodySortOrderStore from './MessageBodySortStore';
import { DbData } from '../api/indexedDb';
import FiltersHistoryStore, { FiltersHistoryType } from './FiltersHistoryStore';
import { intervalOptions } from '../models/Graph';
import { defaultPanelsLayout } from './workspace/WorkspaceViewStore';
import { getRangeFromTimestamp } from '../helpers/date';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { SessionsStore } from './messages/SessionsStore';
import EventsFilter from '../models/filter/EventsFilter';

export default class RootStore {
	notificationsStore = notificationStoreInstance;

	filtersHistoryStore = new FiltersHistoryStore(this.api.indexedDb, this.notificationsStore);

	messageDisplayRulesStore = new MessageDisplayRulesStore(this, this.api.indexedDb);

	messageBodySortStore = new MessageBodySortOrderStore(this, this.api.indexedDb);

	workspacesStore: WorkspacesStore;

	sessionsStore = new SessionsStore(this.api.indexedDb);

	constructor(private api: ApiSchema) {
		this.workspacesStore = new WorkspacesStore(
			this,
			this.api,
			this.filtersHistoryStore,
			this.parseUrlState(),
		);

		window.history.replaceState({}, '', window.location.pathname);
	}

	@computed
	public get isBookmarksFull(): boolean {
		return this.workspacesStore.selectedStore.bookmarksStore.isBookmarksFull;
	}

	public getAppState = (): WorkspacesUrlState | null => {
		const activeWorkspace = this.workspacesStore.activeWorkspace;

		let eventStoreState: EventStoreURLState = {};
		let messagesStoreState: MessagesStoreURLState = {};

		if (activeWorkspace && isWorkspaceStore(activeWorkspace)) {
			const clearFilter = (filter: Partial<MessageFilterState> | Partial<EventsFilter>) => {
				const tempFilter = toJS(filter);
				getObjectKeys(tempFilter).forEach(filterKey => {
					if (tempFilter[filterKey]?.values.length === 0) delete tempFilter[filterKey];
				});
				return getObjectKeys(tempFilter).length === 0 ? undefined : tempFilter;
			};
			const eventsStore: EventsStore = activeWorkspace.eventsStore;
			eventStoreState = {
				filter:
					(eventsStore.filterStore.filter && clearFilter(eventsStore.filterStore.filter)) ||
					undefined,
				range: eventsStore.filterStore.range,
				panelArea: eventsStore.viewStore.eventsPanelArea,
				search:
					eventsStore.searchStore.tokens.length > 0
						? eventsStore.searchStore.tokens.map(t => t.pattern)
						: undefined,
				selectedEventId: activeWorkspace.experimentalAPIEventsStore.selectedEvent?.eventId,
				flattenedListView:
					eventsStore.viewStore.flattenedListView === false
						? undefined
						: eventsStore.viewStore.flattenedListView,
			};
			const messagesStore: MessagesStore = activeWorkspace.messagesStore;
			messagesStoreState = {
				timestampFrom: messagesStore.filterStore.filter.timestampFrom,
				timestampTo: messagesStore.filterStore.filter.timestampTo,
				streams:
					messagesStore.filterStore.filter.streams.length > 0
						? messagesStore.filterStore.filter.streams
						: undefined,
				isSoftFilter:
					messagesStore.filterStore.isSoftFilter === false
						? undefined
						: messagesStore.filterStore.isSoftFilter,
				sse:
					messagesStore.filterStore.sseMessagesFilter &&
					clearFilter(messagesStore.filterStore.sseMessagesFilter),
			};

			getObjectKeys(eventStoreState).forEach(key => {
				if (eventStoreState[key] === undefined || eventStoreState[key] === null) {
					delete eventStoreState[key];
				}
			});

			getObjectKeys(messagesStoreState).forEach(key => {
				if (messagesStoreState[key] === undefined || messagesStoreState[key] === null) {
					delete messagesStoreState[key];
				}
			});
			return [
				toJS({
					events: eventStoreState,
					messages: messagesStoreState,
					timeRange: activeWorkspace.graphStore.range,
					interval: activeWorkspace.graphStore.interval,
					layout: activeWorkspace.viewStore.panelsLayout,
				}),
			];
		}
		return null;
	};

	private parseUrlState = (): WorkspacesUrlState | null => {
		try {
			if (window.location.search.split('&').length > 1) {
				throw new Error('Only one query parameter expected.');
			}
			const searchParams = new URLSearchParams(window.location.search);
			const filtersToPin = searchParams.get('filters');
			const workspacesUrlState = searchParams.get('workspaces');
			const timestamp = searchParams.get('timestamp');
			const eventId = searchParams.get('eventId');
			const messageId = searchParams.get('messageId');

			if (filtersToPin) {
				const filtersHistoryItem: FiltersHistoryType<FilterState> = JSON.parse(
					window.atob(filtersToPin),
				);
				const { type, filters } = filtersHistoryItem;

				if (type === 'event') {
					this.filtersHistoryStore
						.onEventFilterSubmit(filters as EventFilterState, true)
						.then(() => {
							this.filtersHistoryStore.showSuccessNotification(type);
						});
				} else {
					this.filtersHistoryStore
						.onMessageFilterSubmit(filters as MessageFilterState, true)
						.then(() => {
							this.filtersHistoryStore.showSuccessNotification(type);
						});
				}
				return null;
			}
			if (workspacesUrlState) {
				return JSON.parse(window.atob(workspacesUrlState));
			}
			const interval = intervalOptions[0];
			const timeRange = timestamp ? getRangeFromTimestamp(+timestamp, interval) : undefined;

			return [
				{
					events: eventId || { range: timeRange },
					messages: messageId || {
						timestampTo: timestamp ? parseInt(timestamp) : null,
					},
					timeRange,
					interval,
					layout: messageId ? [0, 100] : defaultPanelsLayout,
				},
			];
		} catch (error) {
			this.notificationsStore.addMessage({
				notificationType: 'urlError',
				type: 'error',
				link: window.location.href,
				error,
				id: nanoid(),
			});
			return null;
		}
	};

	// workaround to reset graph search state as it uses internal state
	@observable resetGraphSearchData = false;

	@action
	public handleQuotaExceededError = async (unsavedData?: DbData) => {
		const errorId = nanoid();
		this.notificationsStore.addMessage({
			notificationType: 'genericError',
			type: 'error',
			header: 'QuotaExceededError',
			description: 'Not enough storage space to save data. Clear all data?',
			action: {
				label: 'OK',
				callback: () => this.clearAppData(errorId, unsavedData),
			},
			id: errorId,
		});
	};

	public clearAppData = async (errorId: string, unsavedData?: DbData) => {
		this.notificationsStore.deleteMessage(errorId);
		try {
			await this.api.indexedDb.clearAllData();

			await Promise.all([
				this.workspacesStore.syncData(unsavedData),
				this.messageDisplayRulesStore.syncData(unsavedData),
				this.messageBodySortStore.syncData(unsavedData),
			]);

			this.notificationsStore.addMessage({
				notificationType: 'genericError',
				type: 'success',
				header: 'Data has been removed',
				description: '',
				id: nanoid(),
			});
		} catch (error) {
			this.workspacesStore.syncData(unsavedData);
			this.messageDisplayRulesStore.syncData(unsavedData);
			this.messageBodySortStore.syncData(unsavedData);
		}
	};
}
