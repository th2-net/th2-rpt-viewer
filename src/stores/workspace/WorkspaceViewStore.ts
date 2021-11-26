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
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import EventsStore from '../events/EventsStore';
import MessagesStore from '../messages/MessagesStore';

type InitialState = Partial<{
	panelArea: number;
	isLoading: boolean;
	flattenedListView: boolean;
	panelsLayout: WorkspacePanelsLayout;
}>;

export const defaultPanelsLayout: WorkspacePanelsLayout =
	process.env.NODE_ENV === 'development' ? [45, 30, 25, 0] : [0, 100, 0, 0];

export default class WorkspaceViewStore {
	constructor(initalState?: InitialState) {
		if (initalState) {
			this.init(initalState);
		}
	}

	@observable
	public eventsPanelArea = 50;

	@observable
	public panelsLayout: WorkspacePanelsLayout = defaultPanelsLayout;

	@observable
	public flattenedListView = false;

	@observable
	public activePanel: EventsStore | MessagesStore | null = null;

	@observable
	public collapsedPanels: number[] = [];

	@action
	public setPanelArea = (panelArea: number) => {
		this.eventsPanelArea = panelArea;
	};

	@action
	public setPanelsLayout = (panelsLayout: WorkspacePanelsLayout) => {
		this.panelsLayout = panelsLayout;
	};

	@action
	public setCollapsedPanels = (collapsedPanels: number[]) => {
		this.collapsedPanels = collapsedPanels;
	};

	@action
	public collapsePanel = (index: number) => {
		if (this.collapsedPanels.length === 0) {
			this.panelsLayout =
				index === 0
					? [0, 35, 35, 30]
					: index === 1
					? [35, 0, 35, 30]
					: index === 2
					? [35, 35, 0, 30]
					: [35, 35, 30, 0];
		}
		if (this.collapsedPanels.length === 1 && this.collapsedPanels.includes(index)) {
			this.panelsLayout = [35, 25, 20, 20];
		}
		if (this.collapsedPanels.length === 1 && !this.collapsedPanels.includes(index)) {
			if (index === 0) {
				this.panelsLayout = this.collapsedPanels.includes(1)
					? [0, 0, 50, 50]
					: this.collapsedPanels.includes(2)
					? [0, 50, 0, 50]
					: [0, 50, 50, 0];
			}

			if (index === 1) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 0, 50, 50]
					: this.collapsedPanels.includes(2)
					? [50, 0, 0, 50]
					: [50, 0, 50, 0];
			}

			if (index === 2) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 50, 0, 50]
					: this.collapsedPanels.includes(1)
					? [50, 0, 0, 50]
					: [50, 50, 0, 0];
			}

			if (index === 3) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 50, 50, 0]
					: this.collapsedPanels.includes(1)
					? [50, 0, 50, 0]
					: [50, 50, 0, 0];
			}
		}
		if (this.collapsedPanels.length === 2 && this.collapsedPanels.includes(index)) {
			if (index === 0) {
				this.panelsLayout = this.collapsedPanels.includes(1)
					? [45, 0, 30, 25]
					: this.collapsedPanels.includes(2)
					? [45, 30, 0, 25]
					: [45, 30, 25, 0];
			}

			if (index === 1) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 35, 35, 30]
					: this.collapsedPanels.includes(2)
					? [35, 35, 0, 30]
					: [35, 35, 30, 0];
			}

			if (index === 2) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 35, 35, 30]
					: this.collapsedPanels.includes(1)
					? [35, 0, 35, 30]
					: [35, 35, 30, 0];
			}

			if (index === 3) {
				this.panelsLayout = this.collapsedPanels.includes(0)
					? [0, 35, 35, 30]
					: this.collapsedPanels.includes(1)
					? [35, 0, 35, 30]
					: [35, 35, 0, 30];
			}
		}
		if (this.collapsedPanels.length === 2 && !this.collapsedPanels.includes(index)) {
			if (index === 0) {
				this.panelsLayout =
					this.collapsedPanels.includes(1) && this.collapsedPanels.includes(2)
						? [0, 0, 0, 100]
						: this.collapsedPanels.includes(1) && this.collapsedPanels.includes(3)
						? [0, 0, 100, 0]
						: [0, 100, 0, 0];
			}

			if (index === 1) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(2)
						? [0, 0, 0, 100]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(3)
						? [0, 0, 100, 0]
						: [100, 0, 0, 0];
			}

			if (index === 2) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(1)
						? [0, 0, 0, 100]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(3)
						? [0, 100, 0, 0]
						: [100, 0, 0, 0];
			}

			if (index === 3) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(1)
						? [0, 0, 100, 0]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(2)
						? [0, 100, 0, 0]
						: [100, 0, 0, 0];
			}
		}
		if (this.collapsedPanels.length === 3 && this.collapsedPanels.includes(index)) {
			if (index === 0) {
				this.panelsLayout =
					this.collapsedPanels.includes(1) && this.collapsedPanels.includes(2)
						? [50, 0, 0, 50]
						: this.collapsedPanels.includes(1) && this.collapsedPanels.includes(3)
						? [50, 0, 50, 0]
						: [50, 50, 0, 0];
			}

			if (index === 1) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(2)
						? [0, 50, 0, 50]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(3)
						? [0, 50, 50, 0]
						: [50, 50, 0, 0];
			}

			if (index === 2) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(1)
						? [0, 0, 50, 50]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(3)
						? [0, 50, 50, 0]
						: [50, 0, 50, 0];
			}

			if (index === 3) {
				this.panelsLayout =
					this.collapsedPanels.includes(0) && this.collapsedPanels.includes(1)
						? [0, 0, 50, 50]
						: this.collapsedPanels.includes(0) && this.collapsedPanels.includes(2)
						? [0, 50, 0, 50]
						: [50, 0, 0, 50];
			}
		}
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
		this.eventsPanelArea = initalState.panelArea ?? 100;
		this.flattenedListView = Boolean(initalState.flattenedListView);
		this.panelsLayout = initalState.panelsLayout ?? defaultPanelsLayout;
	};
}
