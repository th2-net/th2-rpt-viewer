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

import {
	observable,
	action,
	computed,
	toJS,
} from 'mobx';
import PanelArea from '../util/PanelArea';

export default class WindowViewStore {
	constructor(viewStore?: WindowViewStore) {
		if (viewStore) {
			this.isLoading = viewStore.isLoading.valueOf();
			this.panelArea = toJS(viewStore.panelArea);
			this.eventTableModeEnabled = toJS(viewStore.eventTableModeEnabled);
		}
	}

	@observable isLoading = true;

	@observable panelArea: PanelArea = PanelArea.P100;

	@observable eventTableModeEnabled = false;

	@action
	setTableModeEnabled = (isEnabled: boolean) => {
		this.eventTableModeEnabled = isEnabled;
	};

	@action
	setPanelArea = (panelArea: PanelArea) => {
		this.panelArea = panelArea;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};

	@computed get isLeftPanelClosed() {
		return this.panelArea === PanelArea.P0;
	}

	@computed get isRightPanelClosed() {
		return this.panelArea === PanelArea.P100;
	}
}
