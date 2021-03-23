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

import { action, makeObservable } from 'mobx';
import { nanoid } from 'nanoid';
import { EventMessage } from 'models/EventMessage';
import { ActionType, EventAction, EventTreeNode } from 'models/EventAction';
import { getTimestampAsNumber, timestampToNumber } from 'helpers/date';
import ApiSchema from 'api/ApiSchema';
import { isEvent, isEventMessage } from 'helpers/event';
import { getRangeFromTimestamp, WorkspaceInitialState } from './WorkspaceStore';
import { SearchStore } from '../SearchStore';
import WorkspaceViewStore from './WorkspaceViewStore';
import WorkspacesStore from './WorkspacesStore';

export const SEARCH_STORE_INTERVAL = 15;

export default class SearchWorkspaceStore {
	public viewStore: WorkspaceViewStore;

	public searchStore: SearchStore;

	public id = nanoid();

	constructor(private workspacesStore: WorkspacesStore, api: ApiSchema) {
		makeObservable(this, {
			onTimestampSelect: action,
			onSavedItemSelect: action,
			onSearchResultItemSelect: action,
			followByTimestamp: action,
		});

		this.searchStore = new SearchStore(api);

		this.viewStore = new WorkspaceViewStore(undefined);
	}

	public onTimestampSelect = (timestamp: number): void => {
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

	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage): void => {
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
				timestampTo: timestampToNumber(savedItem.timestamp),
				timestampFrom: null,
				streams: [savedItem.sessionId],
				targetMessage: savedItem,
			};
			initialWorkspaceState.layout = [0, 100];
		}

		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};

	public onSearchResultItemSelect = (
		resultItem: EventTreeNode | EventAction | EventMessage,
	): void => {
		let initialWorkspaceState: WorkspaceInitialState = {};

		if (isEventMessage(resultItem)) {
			initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByMessage(
				timestampToNumber(resultItem.timestamp),
				true,
				resultItem,
			);
		} else {
			initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByEvent(
				timestampToNumber(resultItem.startTimestamp),
				resultItem,
			);
		}

		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};

	public followByTimestamp = (timestamp: number, resultType: ActionType): void => {
		let initialWorkspaceState: WorkspaceInitialState = {};

		switch (resultType) {
			case ActionType.EVENT_ACTION:
			case ActionType.EVENT_TREE_NODE:
				initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByEvent(timestamp);
				break;
			case ActionType.MESSAGE:
				initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByMessage(timestamp);
				break;
			default:
				break;
		}

		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};
}
