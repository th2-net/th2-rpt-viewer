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

import { autorun, toJS } from 'mobx';
import { EventStoreURLState } from '../stores/events/EventsStore';
import { MessagesStoreURLState } from '../stores/messages/MessagesStore';
import RootStore from '../stores/RootStore';
import { WorkspacesUrlState } from '../stores/workspace/WorkspacesStore';
import localStorageWorker from '../util/LocalStorageWorker';
import { getEventNodeParents } from './event';
import { getObjectKeys } from './object';

export function createURLSearchParams(
	_params: Record<string, string | number | boolean | null | string[] | undefined>,
) {
	const params = new URLSearchParams();

	for (const [key, param] of Object.entries(_params)) {
		// eslint-disable-next-line no-continue
		if (param == null || param === '') continue;
		if (Array.isArray(param)) {
			param.forEach(p => params.append(key, p));
		} else {
			params.set(key, param.toString());
		}
	}

	return params;
}

export function registerUrlMiddleware(rootStore: RootStore) {
	autorun(() => {
		const activeWorkspace = rootStore.workspacesStore.activeWorkspace;

		let eventStoreState: EventStoreURLState = {};
		let messagesStoreState: MessagesStoreURLState = {};

		let urlState: null | WorkspacesUrlState = null;

		if (activeWorkspace && activeWorkspace !== rootStore.workspacesStore.searchWorkspace) {
			const eventsStore = activeWorkspace.eventsStore;
			eventStoreState = {
				filter: {
					eventTypes: eventsStore.filterStore.filter.eventTypes,
					names: eventsStore.filterStore.filter.names,
					timestampFrom: eventsStore.filterStore.filter.timestampFrom,
					timestampTo: eventsStore.filterStore.filter.timestampTo,
				},
				panelArea: eventsStore.viewStore.eventsPanelArea,
				selectedNodesPath: eventsStore.selectedNode
					? [...getEventNodeParents(eventsStore.selectedNode), eventsStore.selectedNode.eventId]
					: undefined,
				search:
					eventsStore.searchStore.tokens.length > 0
						? eventsStore.searchStore.tokens.map(t => t.pattern)
						: undefined,
				flattenedListView: eventsStore.viewStore.flattenedListView,
				selectedParentId:
					eventsStore.viewStore.flattenedListView && eventsStore.selectedParentNode
						? eventsStore.selectedParentNode.eventId
						: undefined,
			};
			const messagesStore = activeWorkspace.messagesStore;
			messagesStoreState = {
				timestampFrom: messagesStore.filterStore.filter.timestampFrom,
				timestampTo: messagesStore.filterStore.filter.timestampTo,
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
			urlState = [
				toJS({
					events: eventStoreState,
					messages: messagesStoreState,
					timeRange: activeWorkspace.graphStore.range,
					interval: activeWorkspace.graphStore.interval,
					layout: activeWorkspace.viewStore.panelsLayout,
				}),
			];
		}

		const searchParams = new URLSearchParams(
			urlState
				? {
						workspaces: window.btoa(JSON.stringify(urlState)),
				  }
				: undefined,
		);
		localStorageWorker.setLastSearchQuery(searchParams.toString());
		window.history.replaceState({}, '', window.location.pathname);
	});
}
