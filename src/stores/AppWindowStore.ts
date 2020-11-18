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

import { action, observable, computed } from 'mobx';
import { TabTypes, AppTab } from '../models/util/Windows';
import MessagesStore from './MessagesStore';
import EventsStore, { EventStoreURLState } from './EventsStore';
import ApiSchema from '../api/ApiSchema';
import { isEventsTab, isMessagesTab } from '../helpers/windows';
import { SelectedStore } from './SelectedStore';

export default class AppWindowStore {
	constructor(private selectedStore: SelectedStore, private api: ApiSchema) {}

	@observable tabs: AppTab[] = [];

	@observable activeTabIndex = 0;

	@computed get isEmpty() {
		return this.tabs.length === 0;
	}

	@computed get activeTab() {
		return this.tabs[this.activeTabIndex];
	}

	@action
	duplicateTab = (tabIndex: number) => {
		const tabToDublicate = this.tabs[tabIndex];
		if (isEventsTab(tabToDublicate)) {
			this.addEventsTab(new EventsStore(this.api, this.selectedStore, tabToDublicate.store));
		} else {
			this.addMessagesTab(new MessagesStore(this.api, this.selectedStore, tabToDublicate.store));
		}

		this.activeTabIndex = this.tabs.length - 1;
	};

	@action
	closeTab = (tabIndex: number) => {
		const tabToClose = this.removeTab(tabIndex);
		if (isMessagesTab(tabToClose)) {
			tabToClose.store.dispose();
		}
	};

	@action
	removeTab = (tabIndex: number): AppTab => {
		if (tabIndex <= this.activeTabIndex) {
			this.activeTabIndex = this.activeTabIndex === 0 ? 0 : this.activeTabIndex - 1;
		}

		return this.tabs.splice(tabIndex, 1)[0];
	};

	@action
	addTabs = (tabs: AppTab[] | AppTab, index = this.tabs.length) => {
		const tabsToAdd = Array.isArray(tabs) ? tabs : [tabs];
		this.tabs.splice(index, 0, ...tabsToAdd);
		this.activeTabIndex = this.tabs.length - 1;
	};

	@action
	setActiveTab = (tabIndex: number) => {
		this.activeTabIndex = tabIndex;
	};

	@action
	changeTabPosition = (currentTabIndex: number, newIndex: number) => {
		if (currentTabIndex === newIndex) return;
		const activeTab = this.tabs[this.activeTabIndex];
		const insertBeforeTab = this.tabs[newIndex];
		const movedTab = this.tabs.splice(currentTabIndex, 1)[0];
		if (!insertBeforeTab) {
			this.tabs.push(movedTab);
		} else {
			this.tabs.splice(
				this.tabs.findIndex(t => t === insertBeforeTab),
				0,
				movedTab,
			);
		}
		this.activeTabIndex = this.tabs.findIndex(t => t === activeTab);
	};

	@action
	addEventsTab = (defaultState: EventsStore | EventStoreURLState | null = null) => {
		this.addTabs({
			type: TabTypes.Events,
			store: new EventsStore(this.api, this.selectedStore, defaultState),
		});
	};

	@action
	addMessagesTab = (store?: MessagesStore) => {
		this.addTabs({
			type: TabTypes.Messages,
			store: new MessagesStore(this.api, this.selectedStore, store),
		});
	};
}
