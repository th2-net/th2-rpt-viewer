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

import { toJS } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import WorkspacesStore, { WorkspacesUrlState } from './workspace/WorkspacesStore';
import notificationStoreInstance from './NotificationsStore';
import EventsStore, { EventStoreURLState } from './events/EventsStore';
import MessagesStore, { MessagesStoreURLState } from './messages/MessagesStore';
import { getObjectKeys } from '../helpers/object';
import { isWorkspaceStore } from '../helpers/workspace';
import MessageDisplayRulesStore from './MessageDisplayRulesStore';
import MessageBodySortOrderStore from './MessageBodySortStore';

export default class RootStore {
	notificationsStore = notificationStoreInstance;

	messageDisplayRulesStore = new MessageDisplayRulesStore();

	messageBodySortStore = new MessageBodySortOrderStore();

	workspacesStore: WorkspacesStore;

	constructor(private api: ApiSchema) {
		this.workspacesStore = new WorkspacesStore(this.api, this.parseUrlState());

		window.history.replaceState({}, '', window.location.pathname);
	}

	getAppState = (): WorkspacesUrlState | null => {
		const activeWorkspace = this.workspacesStore.activeWorkspace;

		let eventStoreState: EventStoreURLState = {};
		let messagesStoreState: MessagesStoreURLState = {};

		if (activeWorkspace && isWorkspaceStore(activeWorkspace)) {
			const eventsStore: EventsStore = activeWorkspace.eventsStore;
			eventStoreState = {
				filter: eventsStore.filterStore.filter || undefined,
				range: eventsStore.filterStore.range,
				panelArea: eventsStore.viewStore.eventsPanelArea,
				search:
					eventsStore.searchStore.tokens.length > 0
						? eventsStore.searchStore.tokens.map(t => t.pattern)
						: undefined,
				selectedEventId: eventsStore.selectedNode?.eventId,
				flattenedListView: eventsStore.viewStore.flattenedListView,
			};
			const messagesStore: MessagesStore = activeWorkspace.messagesStore;
			messagesStoreState = {
				timestampFrom: messagesStore.filterStore.filter.timestampFrom,
				timestampTo: messagesStore.filterStore.filter.timestampTo,
				streams: messagesStore.filterStore.filter.streams,
				isSoftFilter: messagesStore.filterStore.isSoftFilter,
				sse: messagesStore.filterStore.sseMessagesFilter,
			};

			getObjectKeys(eventStoreState).forEach(key => {
				if (eventStoreState[key] === undefined) {
					delete eventStoreState[key];
				}
			});

			getObjectKeys(messagesStoreState).forEach(key => {
				if (messagesStoreState[key] === undefined) {
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

	parseUrlState = (): WorkspacesUrlState | null => {
		try {
			const searchParams = new URLSearchParams(window.location.search);
			const workspacesUrlState = searchParams.get('workspaces');
			const parsedState = workspacesUrlState ? JSON.parse(window.atob(workspacesUrlState)) : null;
			return parsedState;
		} catch (error) {
			this.notificationsStore.setUrlError({
				type: 'error',
				link: window.location.href,
				error,
			});
			return null;
		}
	};
}
