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
	toJS,
} from 'mobx';
import PanelArea from '../util/PanelArea';

export default class WindowViewStore {
	@observable isLoading = true;

	@observable beautifiedMessages: string[] = [];

	@observable panelArea: PanelArea = PanelArea.P50;

	@observable eventTableModeEnabled = false;

	@action
	setTableModeEnabled = (isEnabled: boolean) => {
		this.eventTableModeEnabled = isEnabled;
	};

	@action
	uglifyAllMessages = () => {
		this.beautifiedMessages = [];
	};

	@action
	setPanelArea = (panelArea: PanelArea) => {
		this.panelArea = panelArea;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};

	@action
	toggleBeautify = (messageId: string) => {
		if (this.beautifiedMessages.includes(messageId)) {
			this.beautifiedMessages = this.beautifiedMessages.filter(msgId => msgId !== messageId);
			return;
		}
		this.beautifiedMessages = [...this.beautifiedMessages, messageId];
	};

	@computed get isLeftPanelClosed() {
		return this.panelArea === PanelArea.P0;
	}

	@computed get isRightPanelClosed() {
		return this.panelArea === PanelArea.P100;
	}

	static copy(viewStore: WindowViewStore) {
		const copy = new WindowViewStore();

		copy.isLoading = viewStore.isLoading.valueOf();
		copy.beautifiedMessages = toJS(viewStore.beautifiedMessages);
		copy.panelArea = toJS(viewStore.panelArea);
		copy.eventTableModeEnabled = toJS(viewStore.eventTableModeEnabled);

		return copy;
	}
}
