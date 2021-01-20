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

import ApiSchema from '../api/ApiSchema';
import AppViewStore from './AppViewStore';
import WorkspacesStore, { WorkspacesUrlState } from './WorkspacesStore';
import NotificationsStore from './NotificationsStore';
import GraphStore from './GraphStore';
import { registerUrlMiddleware } from '../helpers/url';
import SearchPanelFiltersStore from './SearchPanelFiltersStore';
import { TimeRange } from '../models/Timestamp';

export default class RootStore {
	notificationsStore = NotificationsStore;

	searchPanelFiltersStore = SearchPanelFiltersStore;

	workspacesStore: WorkspacesStore;

	viewStore: AppViewStore;

	graphStore: GraphStore;

	constructor(private api: ApiSchema) {
		const urlState = this.parseUrlState();

		const eventsFilter = urlState?.events.filter;

		const range: TimeRange | null = eventsFilter
			? [eventsFilter.timestampFrom, eventsFilter.timestampTo]
			: null;

		this.graphStore = new GraphStore(this, range);

		this.workspacesStore = new WorkspacesStore(this.api, this.graphStore, urlState);

		this.viewStore = new AppViewStore();

		registerUrlMiddleware(this);
	}

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
