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

import { observable } from 'mobx';
import { nanoid } from 'nanoid';
import ApiSchema from '../api/ApiSchema';
import WorkspacesStore, { WorkspacesUrlState } from './workspace/WorkspacesStore';
import notificationStoreInstance from './NotificationsStore';
import FiltersHistoryStore, { FiltersHistoryType } from './FiltersHistoryStore';
import { intervalOptions } from '../models/Graph';
import { defaultPanelsLayout } from './workspace/WorkspaceViewStore';
import { getRangeFromTimestamp } from '../helpers/date';
import {
	EventFilterState,
	FilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import feedbackStoreInstance from './FeedbackStore';
import PersistedDataRootStore from './persisted/PersistedDataRootStore';

export default class RootStore {
	notificationsStore = notificationStoreInstance;

	feedbackStore = feedbackStoreInstance;

	persistedDataRootStore = new PersistedDataRootStore(
		this.api.indexedDb,
		this.api.persistedDataApi,
	);

	filtersHistoryStore = new FiltersHistoryStore(this.api.indexedDb, this.notificationsStore);

	workspacesStore: WorkspacesStore;

	constructor(private api: ApiSchema) {
		this.workspacesStore = new WorkspacesStore(
			this,
			this.api,
			this.filtersHistoryStore,
			this.parseUrlState(),
		);

		window.history.replaceState({}, '', window.location.pathname);
	}

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
					layout: messageId ? [0, 0, 100, 0] : defaultPanelsLayout,
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
}
