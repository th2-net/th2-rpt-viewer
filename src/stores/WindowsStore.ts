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
		reaction(
			() => this.windows,
			this.getAvailableColors,
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

	@observable private colors: Array<string> = this.defaultColors.slice();

	@observable attachedMessagesIds: Map<string, Array<string>> = new Map();

	@observable pinnedMessagesIds: Array<string> = [];

	@observable windows: AppWindowStore[] = [
		new AppWindowStore(this, this.api, this.colors, null),
	];

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
	moveTab = (originWindowIndex: number, targetWindowIndex: number, tabIndex: number) => {
		if (originWindowIndex === targetWindowIndex) return;
		const originWindow = this.windows[originWindowIndex];
		const targetWindow = this.windows[targetWindowIndex];
		const movedTab = originWindow.deleteTab(tabIndex);

		if (!targetWindow) {
			this.windows.push(
				new AppWindowStore(
					this,
					this.api,
					this.colors,
					[movedTab],
				),
			);
			return;
		}

		targetWindow.addTab(movedTab);

		if (originWindow.isEmpty) {
			this.deleteWindow(originWindowIndex);
		}
	};

	@action
	deleteWindow = (windowIndex: number) => {
		this.windows.splice(windowIndex, 1);
	};

	@action
	private getAvailableColors = (windows: AppWindowStore[]) => {
		if (!windows) {
			this.colors = this.defaultColors.slice();
			return;
		}
		const usedColors = this.windows
			.flatMap(({ tabs }) => tabs)
			.filter(isEventsTab)
			.map(eventsTab => eventsTab.store.color);
		const availableColors = this.colors.filter(color => !usedColors.includes(color));
		this.colors = availableColors.length === 0
			? [randomHexColor()]
			: availableColors;
	};
}
