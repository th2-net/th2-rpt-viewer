/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

import {
	action,
	observable,
	computed,
} from 'mobx';
import { TabTypes, AppTab } from '../models/util/Windows';
import MessagesStore from './MessagesStore';
import EventsStore from './EventsStore';
import WindowsStore from './WindowsStore';
import ApiSchema from '../api/ApiSchema';
import { isEventsTab } from '../helpers/windows';
import { randomHexColor } from '../helpers/color';

export default class AppWindowStore {
	// eslint-disable-next-line no-useless-constructor
	constructor(
		private windowsStore: WindowsStore,
		private api: ApiSchema,
		private colors: Array<string>,
		tabs: AppTab[] | null,
	) {
		if (tabs) {
			this.tabs = tabs;
		}
	}

	@observable tabs: AppTab[] = [
		{
			type: TabTypes.Events,
			store: new EventsStore(
				this.api,
				this.colors[0],
			),
		},
		{
			type: TabTypes.Messages,
			store: new MessagesStore(
				this.api,
				this.windowsStore,
			),
		},
	];

	@observable activeTabIndex = 0;

	@computed get isEmpty() {
		return this.tabs.length === 0;
	}

	@action.bound
	duplicateTab(tabIndex: number) {
		const windowToDubplicate = this.tabs[tabIndex];
		if (windowToDubplicate.type === TabTypes.Events) {
			const usedColors = this.tabs
				.filter(isEventsTab)
				.map(w => w.store.color);
			let color = this.colors.filter(c => !usedColors.includes(c))[0];
			if (!color) {
				color = randomHexColor();
			}
			this.tabs.push({
				type: TabTypes.Events,
				store: EventsStore.copy(windowToDubplicate.store, this.api, color),
			});
			this.activeTabIndex = this.tabs.length - 1;
			return;
		}
		this.tabs.push({
			type: TabTypes.Messages,
			store: MessagesStore.copy(
				windowToDubplicate.store,
				this.api,
				this.windowsStore,
			),
		});
		this.activeTabIndex = this.tabs.length - 1;
	}

	@action
	closeTab = (tabIndex: number) => {
		const windowToClose = this.tabs[tabIndex];
		const isClosable = this.tabs.filter(w => w.type === windowToClose.type).length > 1;
		if (!isClosable) return;
		this.deleteTab(tabIndex);
	};

	@action
	deleteTab = (tabIndex: number): AppTab => {
		if (tabIndex <= this.activeTabIndex) {
			this.activeTabIndex = this.activeTabIndex === 0
				? 0
				: this.activeTabIndex - 1;
		}

		return this.tabs.splice(tabIndex, 1)[0];
	};

	@action
	addTab = (tab: AppTab) => {
		this.tabs.push(tab);
		this.activeTabIndex = this.tabs.length - 1;
	};

	@action
	setActiveTab = (tabIndex: number) => {
		this.activeTabIndex = tabIndex;
	};
}
