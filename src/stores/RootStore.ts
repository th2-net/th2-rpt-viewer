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
import WindowsStore, { WindowsUrlState } from './WindowsStore';
import { isEventsTab, isMessagesTab } from '../helpers/windows';
import { TabTypes } from '../models/util/Windows';
import { EventStoreURLState } from './EventsStore';
import { MessagesStoreURLState } from './MessagesStore';
import { getObjectKeys } from '../helpers/object';

export default class RootStore {
	windowsStore: WindowsStore;

	viewStore: AppViewStore;

	constructor(private api: ApiSchema) {
		this.windowsStore = new WindowsStore(this, this.api, this.parseWindowsState());

		this.viewStore = new AppViewStore();

		autorun(() => {
			const windowsUrlState: WindowsUrlState = this.windowsStore.windows.map(window => {
				let activeTabState: EventStoreURLState | MessagesStoreURLState;

				const activeTab = window.tabs[window.activeTabIndex];

				if (isEventsTab(activeTab)) {
					const eventsStore = activeTab.store;
					activeTabState = {
						type: TabTypes.Events,
						filter: eventsStore.filterStore.isEventsFilterApplied
							? eventsStore.filterStore.eventsFilter : undefined,
						panelArea: eventsStore.viewStore.panelArea,
						selectedNodesPath: eventsStore.selectedNode
							? [...eventsStore.selectedNode.parents, eventsStore.selectedNode.id]
							: undefined,
						search: eventsStore.searchStore.tokens.length > 0
							? eventsStore.searchStore.tokens.map(t => t.pattern)
							: undefined,
						flattenedListView: eventsStore.viewStore.flattenedListView,
						selectedParentId: eventsStore.viewStore.flattenedListView && eventsStore.selectedParentNode
							? eventsStore.selectedParentNode.id : undefined,
					};
				}

				if (isMessagesTab(activeTab)) {
					activeTabState = {
						type: TabTypes.Messages,
					};
				}

				getObjectKeys(activeTabState!)
					.forEach(key => {
						if (activeTabState[key] === undefined) {
							delete activeTabState[key];
						}
					});

				return {
					activeTab: activeTabState!,
					activeTabIndex: window.activeTabIndex.toString(),
				};
			});

			const searchParams = new URLSearchParams({
				windows: window.btoa(JSON.stringify(toJS(windowsUrlState))),
			});

			window.history.replaceState({}, '', `?${searchParams}`);
		});
	}


	parseWindowsState = (): WindowsUrlState | null => {
		try {
			const searchParams = new URLSearchParams(window.location.search);
			const windowsUrlState = searchParams.get('windows');
			const parsedState = windowsUrlState ? JSON.parse(window.atob(windowsUrlState)) : null;
			return parsedState;
		} catch (error) {
			return null;
		}
	};
}
