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

import { action } from 'mobx';
import { nanoid } from 'nanoid';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import WorkspacesStore from './WorkspacesStore';
import { SearchStore } from '../SearchStore';
import ApiSchema from '../../api/ApiSchema';
import { getRangeFromTimestamp, WorkspaceInitialState } from './WorkspaceStore';
import { isEvent, isEventMessage } from '../../helpers/event';
import { getTimestampAsNumber, timestampToNumber } from '../../helpers/date';
import {
	EventFilterState,
	MessageFilterState,
} from '../../components/search-panel/SearchPanelFilters';

const SEARCH_STORE_INTERVAL = 15;

export default class SearchWorkspaceStore {
	public viewStore: WorkspaceViewStore;

	public searchStore: SearchStore;

	public id = nanoid();

	constructor(private workspacesStore: WorkspacesStore, api: ApiSchema) {
		this.searchStore = new SearchStore(api);

		this.viewStore = new WorkspaceViewStore(undefined);
	}

	@action
	public onTimestampSelect = (timestamp: number) => {
		const timeRange = getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL);
		const newWorkspace = this.workspacesStore.createWorkspace({
			timeRange,
			interval: SEARCH_STORE_INTERVAL,
			events: {
				filter: {
					timestampFrom: timeRange[0],
					timestampTo: timeRange[1],
					eventTypes: [],
					names: [],
				},
			},
			messages: {
				timestampTo: timestamp,
			},
		});

		this.workspacesStore.addWorkspace(newWorkspace);
	};

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		const timeRange = getRangeFromTimestamp(getTimestampAsNumber(savedItem), SEARCH_STORE_INTERVAL);
		const initialWorkspaceState: WorkspaceInitialState = {
			timeRange,
			interval: SEARCH_STORE_INTERVAL,
		};
		if (isEvent(savedItem)) {
			initialWorkspaceState.events = {
				targetEvent: savedItem,
			};
			initialWorkspaceState.layout = [100, 0];
		} else {
			initialWorkspaceState.messages = {
				targetMessage: savedItem,
			};
			initialWorkspaceState.layout = [0, 100];
		}

		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};

	@action
	public onSearchResultItemSelect = (resultItem: EventTreeNode | EventAction | EventMessage) => {
		let initialWorkspaceState: WorkspaceInitialState = {};

		if (isEventMessage(resultItem)) {
			const requestInfo = this.searchStore.currentSearch?.request;
			initialWorkspaceState = {
				messages: {
					sse: (requestInfo?.filters as MessageFilterState) || null,
					streams: requestInfo?.state.stream || [],
					timestampFrom: null,
					timestampTo: timestampToNumber(resultItem.timestamp),
					targetMessage: resultItem,
				},
				interval: SEARCH_STORE_INTERVAL,
				layout: [0, 100],
				timeRange: getRangeFromTimestamp(timestampToNumber(resultItem.timestamp), 15),
			};
		} else {
			const requestInfo = this.searchStore.currentSearch?.request;
			const filter = requestInfo?.filters as EventFilterState | undefined;
			const [timestampFrom, timestampTo] = getRangeFromTimestamp(
				timestampToNumber(resultItem.startTimestamp),
				SEARCH_STORE_INTERVAL,
			);
			initialWorkspaceState = {
				events: {
					filter: {
						eventTypes: filter && !filter.type.negative ? filter.type.values : [],
						names: filter && !filter.name.negative ? filter.name.values : [],
						timestampFrom,
						timestampTo,
					},
					targetEvent: resultItem,
				},
				layout: [100, 0],
				interval: SEARCH_STORE_INTERVAL,
				timeRange: [timestampFrom, timestampTo],
			};
		}

		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};
}
