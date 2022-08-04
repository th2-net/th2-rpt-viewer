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
import { Panel } from 'models/Panel';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';

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
	public activePanel: Panel = Panel.Search;

	@action
	public setPanelArea = (panelArea: number) => {
		this.eventsPanelArea = panelArea;
	};

	@action
	public setPanelsLayout = (panelsLayout: WorkspacePanelsLayout) => {
		this.panelsLayout = panelsLayout;
	};

	@action togglePanel = (panel: Panel) => {
		if (this.isPanelCollapsed(this.panelsLayout[panel])) {
			this.expandPanel(panel);
		} else {
			this.collapsePanel(panel);
		}
	};

	private collapsePanel = (targetIndex: number) => {
		const newLayout = [...this.panelsLayout] as WorkspacePanelsLayout;

		for (let i = targetIndex + 1; i < newLayout.length; i++) {
			if (!this.isPanelCollapsed(newLayout[i])) {
				newLayout[i] += newLayout[targetIndex];
				newLayout[targetIndex] = 0;
				break;
			}
		}

		if (!this.isPanelCollapsed(newLayout[targetIndex])) {
			for (let i = targetIndex - 1; i >= 0; i--) {
				if (!this.isPanelCollapsed(newLayout[i])) {
					newLayout[i] += newLayout[targetIndex];
					newLayout[targetIndex] = 0;
					break;
				}
			}
		}

		if (!this.isPanelCollapsed(newLayout[targetIndex])) {
			const panelIndexToSwap = targetIndex === 0 ? 1 : targetIndex - 1;

			[newLayout[targetIndex], newLayout[panelIndexToSwap]] = [
				newLayout[panelIndexToSwap],
				newLayout[targetIndex],
			];
		}

		this.panelsLayout = newLayout;
	};

	private expandPanel = (targetIndex: number) => {
		const expandedPanelCount =
			this.panelsLayout.length - this.panelsLayout.filter(this.isPanelCollapsed).length;

		this.panelsLayout = this.panelsLayout.map((panelArea, panelIndex) =>
			panelIndex === targetIndex
				? 100 / (expandedPanelCount + 1)
				: (panelArea * expandedPanelCount) / (expandedPanelCount + 1),
		) as WorkspacePanelsLayout;
	};

	@action
	public setActivePanel = (panel: Panel) => {
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

	private isPanelCollapsed = (panelArea: number) => panelArea < 10;
}
