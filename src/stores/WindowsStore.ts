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
	observable,
	action,
	computed,
	reaction,
} from 'mobx';
import RootStore from './RootStore';
import ApiSchema from '../api/ApiSchema';
import AppWindowStore from './AppWindowStore';
import { isMessagesTab, isEventsTab } from '../helpers/windows';
import { EventAction } from '../models/EventAction';
import { randomHexColor } from '../helpers/color';
import { EventMessage } from '../models/EventMessage';

export default class WindowsStore {
	private readonly defaultColors = [
		'#997AB8',
		'#00BBCC',
		'#FF5500',
		'#1F66AD',
		'#E69900',
		'#45A155',
	];

	private readonly MAX_TABS_COUNT = 12;

	constructor(private rootStore: RootStore, private api: ApiSchema) {
		this.createDefaultWindow();

		reaction(
			() => this.allTabs,
			this.onWindowsTabsChange,
		);

		reaction(
			() => this.selectedEvents,
			selectedEvents => {
				this.getEventColors(selectedEvents);
				this.getAttachedMessagesIds(selectedEvents);
			},
		);
	}

	@observable eventColors: Map<string, string> = new Map();

	@observable attachedMessagesIds: Array<string> = [];

	@observable pinnedMessagesIds: Array<string> = [];

	@observable windows: AppWindowStore[] = [];

	@computed get allTabs() {
		return this.windows.flatMap(({ tabs }) => tabs);
	}

	@computed get selectedEvents() {
		return this.allTabs
			.filter(isEventsTab)
			.map(eventTab => eventTab.store.selectedEvent)
			.filter((event, i, self): event is EventAction =>
				event !== null && self.findIndex(e => e && e.eventId === event.eventId) === i);
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
		targetTabIndex = 0,
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

	@action
	private getEventColors = (selectedEvents: EventAction[]) => {
		const eventsWithAttachedMessages = selectedEvents.filter(event => event.attachedMessageIds.length	> 0);

		const usedColors2: Array<string> = [];
		for (const [eventId, color] of this.eventColors.entries()) {
			if (eventsWithAttachedMessages.findIndex(e => e.eventId === eventId) !== -1) {
				usedColors2.push(color);
			}
		}
		const availableColors = this.defaultColors.slice().filter(color => !usedColors2.includes(color));

		const updatedEventColorsMap = new Map<string, string>();

		eventsWithAttachedMessages.forEach(({ eventId }) => {
			let color = this.eventColors.get(eventId);
			if (!color) {
				color = availableColors[0] || randomHexColor();
				availableColors.shift();
			}
			updatedEventColorsMap.set(eventId, color);
		});

		this.eventColors = updatedEventColorsMap;
	};

	@action
	private getAttachedMessagesIds = (selectedEvents: EventAction[]) => {
		this.attachedMessagesIds = selectedEvents.reduce<string[]>((attachedMessageIds, event) => (
			[
				...attachedMessageIds,
				...event.attachedMessageIds.filter(id => !attachedMessageIds.includes(id)),
			]
		), []);
	};
}
