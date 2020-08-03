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
	autorun,
} from 'mobx';
import RootStore from './RootStore';
import ApiSchema from '../api/ApiSchema';
import AppWindowStore from './AppWindowStore';
import { isMessagesTab, isEventsTab } from '../helpers/windows';
import { EventAction } from '../models/EventAction';
import { randomHexColor } from '../helpers/color';
import { EventMessage } from '../models/EventMessage';
import { AppTab, TabTypes } from '../models/util/Windows';
import { EventStoreURLState } from './EventsStore';
import { MessagesStoreURLState } from './MessagesStore';

export type WindowsUrlState = Array<Partial<{
	activeTab: EventStoreURLState | MessagesStoreURLState;
	activeTabIndex: string;
}>>;

export default class WindowsStore {
	private readonly defaultColors = [
		'#997AB8',
		'#00BBCC',
		'#FF5500',
		'#1F66AD',
		'#E69900',
		'#45A155',
	];

	public readonly MAX_TABS_COUNT = 12;

	public readonly MAX_WINDOWS = 2;

	constructor(
		private rootStore: RootStore,
		private api: ApiSchema,
		initialState: WindowsUrlState | null,
	) {
		this.init(initialState);

		reaction(
			() => this.selectedEvents,
			selectedEvents => {
				this.getEventColors(selectedEvents);
				this.getAttachedMessagesIds(selectedEvents);
				this.lastSelectedEvent = selectedEvents
					.find(e => e.eventId === this.lastSelectedEventId) || null;
			},
		);

		autorun(() => {
			this.allTabs = this.windows.flatMap(window => window.tabs);

			this.onWindowsTabsChange();
		});

		autorun(() => {
			this.selectedEvents = this.events;
		});
	}

	@observable eventColors: Map<string, string> = new Map();

	@observable attachedMessagesIds: Array<string> = [];

	@observable pinnedMessages: Array<EventMessage> = [];

	@observable windows: AppWindowStore[] = [];

	@observable allTabs: Array<AppTab> = [];

	@observable selectedEvents: Array<EventAction> = [];

	@observable lastSelectedEventId: string | null = null;

	@observable lastSelectedEvent: EventAction | null = null;

	@computed get events() {
		return this.windows.flatMap(window => window.tabs)
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
	public toggleMessagePin = (message: EventMessage) => {
		if (this.pinnedMessages.findIndex(m => m.messageId === message.messageId) === -1) {
			this.pinnedMessages = this.pinnedMessages.concat(message);
		} else {
			this.pinnedMessages = this.pinnedMessages.filter(
				msg => msg.messageId !== message.messageId,
			);
		}
	};

	@action
	public moveTab = (
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
			newWindow.addTabs([originWindow.removeTab(tabIndex)]);
			const startIndex = targetWindowIndex === -1 ? 0 : this.windows.length;
			this.windows.splice(startIndex, 0, newWindow);
			return;
		}

		if (targetWindow !== originWindow) {
			targetWindow.addTabs([originWindow.removeTab(tabIndex)], targetTabIndex);

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
			.forEach(window => this.windows.splice(this.windows.findIndex(w => w === window), 1));
	};

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
		const eventsWithAttachedMessages = selectedEvents
			.filter(event => event.attachedMessageIds.length > 0);

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
		this.attachedMessagesIds = [...new Set(selectedEvents.flatMap(({ attachedMessageIds }) => attachedMessageIds))];
	};

	@action
	private init(initialState: WindowsUrlState | null) {
		if (!initialState) {
			this.createDefaultWindow();
			return;
		}
		try {
			const windows = initialState.map(w => {
				const window = new AppWindowStore(this, this.api);
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
