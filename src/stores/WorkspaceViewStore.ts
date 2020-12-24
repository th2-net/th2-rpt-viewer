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

import { observable, action, computed } from 'mobx';
import PanelArea from '../util/PanelArea';
import EventsStore from './EventsStore';
import MessagesStore from './MessagesStore';

type InitialState = Partial<{
	panelArea: PanelArea;
	isLoading: boolean;
	flattenedListView: boolean;
}>;

export default class WorkspaceViewStore {
	constructor(private eventsStore?: EventsStore, initalState?: InitialState) {
		if (initalState) {
			this.init(initalState);
		}
		if (this.eventsStore) {
			this.targetPanel = this.eventsStore;
		}
	}

	@observable isLoading = true;

	@observable panelArea: PanelArea = PanelArea.P50;

	@observable flattenedListView = false;

	@observable targetPanel: EventsStore | MessagesStore | null = null;

	@computed get isLeftPanelClosed() {
		return this.panelArea === PanelArea.P0;
	}

	@computed get isRightPanelClosed() {
		return this.panelArea === PanelArea.P100;
	}

	@action
	setPanelArea = (panelArea: PanelArea) => {
		this.panelArea = panelArea;
	};

	@action
	setIsLoading = (isLoading: boolean) => {
		this.isLoading = isLoading;
	};

	@action
	setTargetPanel = (panel: EventsStore | MessagesStore | null) => {
		this.targetPanel = panel;
	};

	@action
	toggleFlattenEventListView = () => {
		this.flattenedListView = !this.flattenedListView;
	};

	@action
	private init = (initalState: InitialState) => {
		this.isLoading = initalState.isLoading ?? false;
		this.panelArea = initalState.panelArea ?? PanelArea.P100;
		this.flattenedListView = initalState.flattenedListView ?? false;
	};
}
