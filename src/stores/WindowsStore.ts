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

import { observable, action, computed, autorun } from 'mobx';
import ApiSchema from '../api/ApiSchema';
import AppWindowStore from './AppWindowStore';
import { isMessagesTab, isEventsTab } from '../helpers/windows';
import { AppTab, TabTypes } from '../models/util/Windows';
import { EventStoreURLState } from './EventsStore';
import { MessagesStoreURLState } from './MessagesStore';
import { SelectedStore } from './SelectedStore';

export type WindowsUrlState = Array<
	Partial<{
		activeTab: EventStoreURLState | MessagesStoreURLState;
		activeTabIndex: string;
	}>
>;

export default class WindowsStore {
	public readonly MAX_TABS_COUNT = 12;

	public readonly MAX_WINDOWS = 2;

	selectedStore = new SelectedStore(this, this.api);

	constructor(private api: ApiSchema, initialState: WindowsUrlState | null) {
		this.init(initialState);

		autorun(() => {
			this.allTabs = this.windows.flatMap(window => window.tabs);

			this.onWindowsTabsChange();
		});
	}

	@observable windows: AppWindowStore[] = [];

	@observable allTabs: Array<AppTab> = [];

	@computed get eventTabs() {
		return this.allTabs.filter(isEventsTab);
	}

	@computed get isDuplicable() {
		return this.allTabs.length < this.MAX_TABS_COUNT;
	}

	@computed get isEventsTabClosable() {
		return this.allTabs.filter(tab => isEventsTab(tab)).length > 1;
	}

	@computed get isMessagesTabClosable() {
		return this.allTabs.filter(tab => isMessagesTab(tab)).length > 1;
	}

	@computed get activeTabs() {
		return this.windows.map(window => window.tabs[window.activeTabIndex]);
	}

	@action
	public moveTab = (
		originWindowIndex: number,
		targetWindowIndex: number,
		tabIndex: number,
		targetTabIndex = 0,
	) => {
		if (originWindowIndex === targetWindowIndex && tabIndex === targetTabIndex) return;

		const originWindow = this.windows[originWindowIndex];
		const targetWindow = this.windows[targetWindowIndex];

		if (!targetWindow) {
			const newWindow = new AppWindowStore(this.selectedStore, this.api);
			newWindow.addTabs([originWindow.removeTab(tabIndex)]);
			const startIndex = targetWindowIndex === -1 ? 0 : this.windows.length;
			this.windows.splice(startIndex, 0, newWindow);
			return;
		}

		if (targetWindow !== originWindow) {
			targetWindow.addTabs([originWindow.removeTab(tabIndex)], targetTabIndex);
			targetWindow.activeTabIndex = targetTabIndex;
			return;
		}

		originWindow.changeTabPosition(tabIndex, targetTabIndex);
	};

	@action
	public deleteWindow = (windowIndex: number) => {
		this.windows.splice(windowIndex, 1);
	};

	@action
	private onWindowsTabsChange = () => {
		this.windows
			.filter(window => window.isEmpty)
			.forEach(window =>
				this.windows.splice(
					this.windows.findIndex(w => w === window),
					1,
				),
			);
	};

	@action
	private createDefaultWindow() {
		const defaultWindow = new AppWindowStore(this.selectedStore, this.api);
		defaultWindow.addEventsTab();
		defaultWindow.addMessagesTab();
		defaultWindow.activeTabIndex = 0;
		this.windows.push(defaultWindow);
	}

	@action
	private init(initialState: WindowsUrlState | null) {
		const persistedPinnedMessages = localStorage.getItem('pinnedMessages');
		if (!persistedPinnedMessages) {
			localStorage.setItem('pinnedMessages', JSON.stringify([]));
		}

		if (!initialState) {
			this.createDefaultWindow();
			return;
		}
		try {
			const windows = initialState.map(w => {
				const window = new AppWindowStore(this.selectedStore, this.api);
				if (w.activeTab?.type !== undefined) {
					switch (w.activeTab.type) {
						case TabTypes.Events:
							window.addEventsTab(w.activeTab);
							break;
						case TabTypes.Messages:
							window.addMessagesTab();
							break;
						default:
							break;
					}
				}
				return window;
			});

			const allTabs = windows.flatMap(w => w.tabs);

			if (allTabs.filter(isEventsTab).length === 0) {
				windows[0].addEventsTab();
			}

			if (allTabs.filter(isMessagesTab).length === 0) {
				windows[0].addMessagesTab();
			}

			windows.forEach((window, index) => {
				const activeTabIndex = parseInt(initialState[index].activeTabIndex ?? '0');
				if (Number.isInteger(activeTabIndex) && window.tabs[activeTabIndex]) {
					// eslint-disable-next-line no-param-reassign
					window.activeTabIndex = activeTabIndex;
				}
			});

			this.windows = windows;
		} catch (error) {
			this.createDefaultWindow();
		}
	}
}
