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

import { observable, action, makeObservable } from 'mobx';
import { WorkspacePanelsLayout } from 'components/workspace/WorkspaceSplitter';
import EventsStore from '../events/EventsStore';
import MessagesStore from '../messages/MessagesStore';

type InitialState = Partial<{
	panelArea: number;
	isLoading: boolean;
	flattenedListView: boolean;
	panelsLayout: WorkspacePanelsLayout;
}>;

const defaultPanelsLayout: WorkspacePanelsLayout =
	process.env.NODE_ENV === 'development' ? [50, 50] : [100, 0];

export default class WorkspaceViewStore {
	constructor(initalState?: InitialState) {
		makeObservable<WorkspaceViewStore, 'init'>(this, {
			eventsPanelArea: observable,
			panelsLayout: observable,
			flattenedListView: observable,
			activePanel: observable,
			setPanelArea: action,
			setPanelsLayout: action,
			setActivePanel: action,
			toggleFlattenEventListView: action,
			init: action,
		});

		if (initalState) {
			this.init(initalState);
		}
	}

	public eventsPanelArea = 50;

	public panelsLayout: WorkspacePanelsLayout = defaultPanelsLayout;

	public flattenedListView = false;

	public activePanel: EventsStore | MessagesStore | null = null;

	public setPanelArea = (panelArea: number): void => {
		this.eventsPanelArea = panelArea;
	};

	public setPanelsLayout = (panelsLayout: WorkspacePanelsLayout): void => {
		this.panelsLayout = panelsLayout;
	};

	public setActivePanel = (panel: EventsStore | MessagesStore | null): void => {
		this.activePanel = panel;
	};

	public toggleFlattenEventListView = (): void => {
		this.flattenedListView = !this.flattenedListView;
	};

	private init = (initalState: InitialState) => {
		this.eventsPanelArea = initalState.panelArea ?? 100;
		this.flattenedListView = Boolean(initalState.flattenedListView);
		this.panelsLayout = initalState.panelsLayout ?? defaultPanelsLayout;
	};
}
