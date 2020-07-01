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
	reaction,
} from 'mobx';
import ApiSchema from '../api/ApiSchema';
import { EventMessage } from '../models/EventMessage';
import { isEventsTab } from '../helpers/windows';
import { randomHexColor } from '../helpers/color';
import AppWindowStore from './AppWindowStore';
import { EventAction } from '../models/EventAction';

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

		reaction(
			() => this.windows.flatMap(({ tabs }) => tabs)
				.filter(isEventsTab)
				.map(eventTab => eventTab.store.selectedEvent)
				.filter((event): event is EventAction => event !== null && event.attachedMessageIds.length	> 0),
			this.onSelectedEventsChange,
		);
	}

	@observable eventsAttachedMessages: Array<{
		eventId: string;
		messagesIds: Array<string>;
		color: string;
	}> = [];

	@observable pinnedMessagesIds: Array<string> = [];

	@observable windows: AppWindowStore[] = [];

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

	@action.bound
	private onSelectedEventsChange(selectedEvents: EventAction[]) {
		const events = selectedEvents
			.filter((event, index, self) => self.findIndex(e => e.eventId === event.eventId) === index);
		const eventIds = events.map(({ eventId }) => eventId);
		const usedColors = this.eventsAttachedMessages.filter(({ eventId }) => eventIds.includes(eventId))
			.map(({ color }) => color);
		const availableColors = this.defaultColors.slice().filter(color => !usedColors.includes(color));

		this.eventsAttachedMessages = events.map(({ eventId, attachedMessageIds }) => {
			let color = this.eventsAttachedMessages.find((e => e.eventId === eventId))?.color;
			if (!color) {
				color = availableColors[0] || randomHexColor();
				availableColors.shift();
			}
			return {
				eventId,
				color,
				messagesIds: attachedMessageIds.slice(),
			};
		});
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
