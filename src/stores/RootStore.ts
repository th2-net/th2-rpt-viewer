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

import { nanoid } from 'nanoid';
import { EventFilterState, FilterState, MessageFilterState } from 'modules/search/models/Search';
import { IFilterConfigStore } from 'models/Stores';
import ApiSchema from '../api/ApiSchema';
import WorkspacesStore, { WorkspacesUrlState } from './workspace/WorkspacesStore';
import notificationStoreInstance from './NotificationsStore';
import MessageBodySortOrderStore from './MessageBodySortStore';
import { DbData } from '../api/indexedDb';
import FiltersHistoryStore, { FiltersHistoryType } from './FiltersHistoryStore';
import { defaultPanelsLayout } from './workspace/WorkspaceViewStore';
import { getRangeFromTimestamp } from '../helpers/date';
import { SessionHistoryStore } from './messages/SessionHistoryStore';
import { FilterConfigStore } from './FilterConfigStore';

export default class RootStore {
	notificationsStore = notificationStoreInstance;

	filtersHistoryStore = new FiltersHistoryStore(this.api.indexedDb, this.notificationsStore);

	messageBodySortStore = new MessageBodySortOrderStore(this, this.api.indexedDb);

	workspacesStore: WorkspacesStore;

	sessionsStore = new SessionHistoryStore(this.api.indexedDb);

	filtersConfigStore: IFilterConfigStore;

	constructor(private api: ApiSchema) {
		this.filtersConfigStore = new FilterConfigStore(api);
		this.workspacesStore = new WorkspacesStore(
			this,
			this.api,
			this.filtersConfigStore,
			this.filtersHistoryStore,
			this.sessionsStore,
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
			const timeRange = timestamp ? getRangeFromTimestamp(+timestamp, 15) : undefined;

			return [
				{
					events: eventId || { range: timeRange },
					messages: messageId || {
						timestampTo: timestamp ? parseInt(timestamp) : null,
					},
					timeRange,
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

	private clearAppData = async (errorId: string, unsavedData?: DbData) => {
		this.notificationsStore.deleteMessage(errorId);
		try {
			await this.api.indexedDb.clearAllData();

			await Promise.all([
				this.workspacesStore.syncData(unsavedData),
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
			this.messageBodySortStore.syncData(unsavedData);
		}
	};
}
