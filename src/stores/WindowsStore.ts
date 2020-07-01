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
	autorun,
	computed,
	reaction,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { EventMessage } from '../models/EventMessage';
import { isEventsTab } from '../helpers/windows';
import { randomHexColor } from '../helpers/color';
import AppWindowStore from './AppWindowStore';

export default class WindowsStore {
	private readonly defaultColors = [
		'#997AB8',
		'#00BBCC',
		'#FF5500',
		'#1F66AD',
		'#E69900',
		'#45A155',
	];

	constructor(private api: ApiSchema) {
		this.createDefaultWindow();

		reaction(
			() => this.windows.flatMap(({ tabs }) => tabs),
			this.onWindowsTabsChange,
		);

		autorun(() => {
			const attachedMessages = this.windows.flatMap(({ tabs }) => tabs)
				.filter(isEventsTab)
				.filter(w => w.store.selectedNode !== null)
				.map(eventsWindow =>
					[eventsWindow.store.color, (eventsWindow.store.selectedEvent?.attachedMessageIds || [])]);
			const map = new Map();
			attachedMessages.forEach(([color, ids]) => {
				if (ids.length > 0) {
					map.set(color, ids);
				}
			});
			this.attachedMessagesIds = map;
		});
	}

	// Map<color, messagesIds[]>
	@observable attachedMessagesIds: Map<string, Array<string>> = new Map();

	@observable pinnedMessagesIds: Array<string> = [];

	@observable windows: AppWindowStore[] = [];

	@computed get colors(): Array<string> {
		if (this.windows.length === 0) return this.defaultColors;
		const usedColors = this.windows
			.flatMap(({ tabs }) => tabs)
			.filter(isEventsTab)
			.map(eventsTab => eventsTab.store.color);
		const availableColors = this.defaultColors.filter(color => !usedColors.includes(color));
		return availableColors.length === 0
			? [randomHexColor()]
			: availableColors;
	}

	@action
	toggleMessagePin = (message: EventMessage) => {
		const { messageId } = message;
		if (!this.pinnedMessagesIds.includes(messageId)) {
			this.pinnedMessagesIds = this.pinnedMessagesIds.concat(messageId);
		} else {
			this.pinnedMessagesIds = this.pinnedMessagesIds.filter(
				id => id !== messageId,
			);
		}
	};

	@action
	moveTab = (
		originWindowIndex: number,
		targetWindowIndex: number,
		tabIndex: number,
		targetTabIndex: number,
	) => {
		if (originWindowIndex === targetWindowIndex
			&& tabIndex === targetTabIndex) return;

		const originWindow = this.windows[originWindowIndex];
		const targetWindow = this.windows[targetWindowIndex];

		if (!targetWindow) {
			const newWindow = new AppWindowStore(this, this.api);
			newWindow.addTabs([originWindow.deleteTab(tabIndex)]);
			const startIndex = targetWindowIndex === -1 ? 0 : this.windows.length;
			this.windows.splice(startIndex, 0, newWindow);
			return;
		}

		if (targetWindow !== originWindow) {
			targetWindow.addTabs([originWindow.deleteTab(tabIndex)], targetTabIndex);

			return;
		}

		originWindow.changeTabPosition(tabIndex, targetTabIndex);
	};

	@action
	deleteWindow = (windowIndex: number) => {
		this.windows.splice(windowIndex, 1);
	};

	@action.bound
	private onWindowsTabsChange() {
		this.windows
			.filter(window => window.isEmpty)
			.forEach(window => this.windows.splice(this.windows.findIndex(w => w === window), 1));
	}

	@action
	private createDefaultWindow() {
		const defaultWindow = new AppWindowStore(this, this.api);
		defaultWindow.addEventsTab();
		defaultWindow.addMessagesTab();
		defaultWindow.activeTabIndex = 0;
		this.windows.push(defaultWindow);
	}
}
