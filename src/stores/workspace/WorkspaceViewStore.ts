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

import { observable, action } from 'mobx';
import PanelArea from '../../util/PanelArea';
import EventsStore from '../events/EventsStore';
import MessagesStore from '../messages/MessagesStore';

type InitialState = Partial<{
	panelArea: PanelArea;
	isLoading: boolean;
	flattenedListView: boolean;
}>;

export default class WorkspaceViewStore {
	constructor(initalState?: InitialState) {
		if (initalState) {
			this.init(initalState);
		}
	}

	@observable
	public panelArea: PanelArea = PanelArea.P50;

	@observable
	public flattenedListView = false;

	@observable
	public activePanel: EventsStore | MessagesStore | null = null;

	@action
	public setPanelArea = (panelArea: PanelArea) => {
		this.panelArea = panelArea;
	};

	@action
	public setActivePanel = (panel: EventsStore | MessagesStore | null) => {
		this.activePanel = panel;
	};

	@action
	public toggleFlattenEventListView = () => {
		this.flattenedListView = !this.flattenedListView;
	};

	@action
	private init = (initalState: InitialState) => {
		this.panelArea = initalState.panelArea ?? PanelArea.P100;
		this.flattenedListView = Boolean(initalState.flattenedListView);
	};
}
