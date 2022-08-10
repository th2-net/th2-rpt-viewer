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
import { ActionType, EventAction, EventTreeNode } from '../../models/EventAction';
import WorkspacesStore from './WorkspacesStore';
import { SearchStore } from '../SearchStore';
import ApiSchema from '../../api/ApiSchema';
import { WorkspaceInitialState } from './WorkspaceStore';
import { isEventMessage } from '../../helpers/event';
import { timestampToNumber, getRangeFromTimestamp } from '../../helpers/date';
import RootStore from '../RootStore';
import BooksStore from '../BooksStore';

export const SEARCH_STORE_INTERVAL = 15;

export default class SearchWorkspaceStore {
	public viewStore: WorkspaceViewStore;

	public searchStore: SearchStore;

	public id = nanoid();

	constructor(
		private rootStore: RootStore,
		private workspacesStore: WorkspacesStore,
		private booksStore: BooksStore,
		api: ApiSchema,
	) {
		this.searchStore = new SearchStore(
			this.workspacesStore,
			api,
			this.workspacesStore.filtersHistoryStore,
			this.rootStore.sessionsStore,
			this.booksStore,
		);

		this.viewStore = new WorkspaceViewStore(undefined);
	}

	@action
	public onTimestampSelect = (timestamp: number) => {
		const range = getRangeFromTimestamp(timestamp, SEARCH_STORE_INTERVAL);
		const newWorkspace = this.workspacesStore.createWorkspace({
			timeRange: range,
			interval: SEARCH_STORE_INTERVAL,
			events: {
				range,
			},
			messages: {
				timestampTo: timestamp,
			},
		});

		this.workspacesStore.addWorkspace(newWorkspace);
	};

	@action
	public onSearchResultItemSelect = (
		resultItem: EventTreeNode | EventAction | EventMessage,
		bookId: string,
		scope: string,
	) => {
		let initialWorkspaceState: WorkspaceInitialState = {};

		if (isEventMessage(resultItem)) {
			initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByMessage(
				timestampToNumber(resultItem.timestamp),
				resultItem,
			);
		} else {
			initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByEvent(
				timestampToNumber(resultItem.startTimestamp),
				scope,
				resultItem,
			);
		}
		const newWorkspace = this.workspacesStore.createWorkspace(initialWorkspaceState);
		this.workspacesStore.addWorkspace(newWorkspace);
	};

	@action
	public followByTimestamp = (timestamp: number, resultType: ActionType, scope: string) => {
		let initialWorkspaceState: WorkspaceInitialState = {};

		switch (resultType) {
			case ActionType.EVENT_ACTION:
			case ActionType.EVENT_TREE_NODE:
				if (scope) {
					initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByEvent(timestamp, scope);
				}
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
