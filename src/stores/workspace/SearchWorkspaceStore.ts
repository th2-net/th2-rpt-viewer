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

import { action, computed, observable } from 'mobx';
import { nanoid } from 'nanoid';
import moment from 'moment';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import WorkspacesStore from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { SearchStore } from '../SearchStore';
import ApiSchema from '../../api/ApiSchema';
import { GraphDataStore } from '../graph/GraphDataStore';
import { SelectedStore } from '../SelectedStore';
import { TimeRange } from '../../models/Timestamp';

export type SeachWorkspaceInitialState = Partial<{
	layout: WorkspacePanelsLayout;
	timeRange: TimeRange | null;
}>;

const INTERVAL_STEP = 15;

export default class SearchWorkspaceStore {
	public viewStore: WorkspaceViewStore;

	public searchStore: SearchStore;

	public graphDataStore: GraphDataStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private selectedStore: SelectedStore,
		api: ApiSchema,
		initialState: SeachWorkspaceInitialState | null,
	) {
		this.searchStore = new SearchStore(api);

		this.graphDataStore = new GraphDataStore(
			this.selectedStore,
			initialState ? initialState.timeRange : null,
		);

		this.viewStore = new WorkspaceViewStore(
			initialState ? { panelsLayout: initialState.layout } : undefined,
		);
	}

	@observable timeRange: TimeRange = [
		moment(Date.now()).utc().valueOf(),
		moment().utc().subtract(15, 'minutes').valueOf(),
	];

	@action onRangeChange(timestamp: number) {
		this.timeRange = [
			moment(timestamp)
				.subtract((INTERVAL_STEP * 60) / 2, 'seconds')
				.valueOf(),
			moment(timestamp)
				.add((INTERVAL_STEP * 60) / 2, 'seconds')
				.valueOf(),
		];
	}

	@computed
	public get isActive() {
		return this.workspacesStore.activeWorkspace === this;
	}

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		const newWorkspace = this.workspacesStore.createWorkspace({
			entity: savedItem,
		});

		this.workspacesStore.addWorkspace(newWorkspace);
		this.workspacesStore.tabsStore.setActiveWorkspace(this.workspacesStore.workspaces.length);
	};
}
