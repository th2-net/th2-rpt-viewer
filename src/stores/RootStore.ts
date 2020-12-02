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
import ApiSchema from '../api/ApiSchema';
import AppViewStore from './AppViewStore';
import WorkspacesStore, { WorkspacesUrlState } from './WorkspacesStore';
import { TabTypes } from '../models/util/Windows';
import { EventStoreURLState } from './EventsStore';
import { getObjectKeys } from '../helpers/object';
import NotificationsStore from './NotificationsStore';
import { getEventNodeParents } from '../helpers/event';
import GraphStore from './GraphStore';

export default class RootStore {
	notificationsStore = NotificationsStore;

	windowsStore: WorkspacesStore;

	viewStore: AppViewStore;

	graphStore = new GraphStore(this);

	constructor(private api: ApiSchema) {
		this.windowsStore = new WorkspacesStore(this.api, this.parseWorkspacesState());

		this.viewStore = new AppViewStore();

		// TODO: move to a separate function

		autorun(() => {
			const workspacesUrlState: WorkspacesUrlState = this.windowsStore.workspaces.map(workspace => {
				let eventStoreState: EventStoreURLState = {};

				const eventsStore = workspace.eventsStore;
				eventStoreState = {
					type: TabTypes.Events,
					filter: eventsStore.filterStore.isEventsFilterApplied
						? eventsStore.filterStore.eventsFilter
						: undefined,
					panelArea: eventsStore.viewStore.panelArea,
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


				getObjectKeys(eventStoreState).forEach(key => {
					if (eventStoreState[key] === undefined) {
						delete eventStoreState[key];
					}
				});

				return {
					events: eventStoreState,
					messages: {},
				};
			});

			const searchParams = new URLSearchParams({
				workspaces: window.btoa(JSON.stringify(toJS(workspacesUrlState))),
			});

			window.history.replaceState({}, '', `?${searchParams}`);
		});
	}

	parseWorkspacesState = (): WorkspacesUrlState | null => {
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
