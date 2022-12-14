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

import { action, computed, reaction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import debounce from 'lodash.debounce';
import { copyTextToClipboard } from 'helpers/copyHandler';
import { showNotification } from 'helpers/showNotification';
import { SearchStore } from 'modules/search/stores/SearchStore';
import { IndexedDbStores, SavedWorkspaceState } from 'api/indexedDb';
import {
	IBookmarksStore,
	IEventsStore,
	IFilterConfigStore,
	IMessagesStore,
	ISearchStore,
} from 'models/Stores';
import { Panel } from 'models/Panel';
import { Session, SessionHistoryStore } from 'modules/messages/stores//SessionHistoryStore';
import { MessageBookmark } from 'modules/bookmarks/models/Bookmarks';
import MessagesStore, {
	MessagesStoreDefaultStateType,
	MessagesStoreURLState,
} from 'modules/messages/stores/MessagesStore';
import { MessagesSearchResult } from 'modules/search/stores/SearchResult';
import EventsStore, {
	EventStoreDefaultStateType,
	EventStoreURLState,
} from '../../modules/events/stores/EventsStore';
import ApiSchema from '../../api/ApiSchema';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { isEventMessage } from '../../helpers/message';
import WorkspacesStore from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { timestampToNumber } from '../../helpers/date';

export type WorkspaceUrlState = Partial<{
	events: EventStoreURLState;
	messages: Partial<MessagesStoreURLState>;
	layout: WorkspacePanelsLayout;
}>;

export type WorkspaceInitialState = Partial<{
	events: EventStoreDefaultStateType;
	messages: MessagesStoreDefaultStateType;
	layout: WorkspacePanelsLayout;
	id: string;
}>;

export default class WorkspaceStore {
	public readonly id = nanoid();

	public readonly searchStore: ISearchStore;

	public readonly eventsStore: IEventsStore;

	public readonly messagesStore: IMessagesStore;

	public readonly viewStore: WorkspaceViewStore;

	constructor(
		private workspacesStore: WorkspacesStore,
		private sessionsStore: SessionHistoryStore,
		private filterConfigStore: IFilterConfigStore,
		private bookmarksStore: IBookmarksStore,
		private api: ApiSchema,
		initialState: WorkspaceInitialState,
	) {
		if (initialState.id) {
			this.id = initialState.id;
		}

		this.searchStore = new SearchStore(
			this.id,
			this.workspacesStore,
			api,
			this.workspacesStore.filtersHistoryStore,
			this.sessionsStore,
			this.filterConfigStore,
		);
		this.viewStore = new WorkspaceViewStore({
			panelsLayout: initialState.layout,
		});
		this.eventsStore = new EventsStore(this, this.filterConfigStore, this.api, initialState.events);
		this.messagesStore = new MessagesStore(
			this.filterConfigStore,
			this.api,
			initialState.messages,
			{
				onSessionsSubmit: this.sessionsStore.saveSessions,
				toggleBookmark: this.bookmarksStore.toggleMessagePin,
			},
		);

		reaction(() => this.eventsStore.selectedNode, this.messagesStore.onSelectedEventChange);

		reaction(() => this.bookmarksStore.messages, this.onMessagesBookmarkChange, {
			fireImmediately: true,
		});

		reaction(() => this.sessionsStore.sessions, this.onSessionHistoryChange, {
			fireImmediately: true,
		});

		reaction(() => this.state, this.saveWorkspaceState);
	}

	@computed
	public get state(): WorkspaceUrlState {
		return {
			events: this.eventsStore.urlState,
			messages: this.messagesStore.urlState,
			layout: this.viewStore.panelsLayout,
		};
	}

	public copyWorkspaceURL = () => {
		const { viewTypeMap, ...messagesState } = this.state.messages || {};
		const urlState: WorkspaceUrlState = toJS(
			{ ...this.state, messages: messagesState },
			{ recurseEverything: true },
		);

		const searchString = new URLSearchParams({
			workspaces: window.btoa(JSON.stringify([urlState])),
		});

		copyTextToClipboard(
			[window.location.origin, window.location.pathname, `?${searchString}`].join(''),
		);
		showNotification('Workspace link copied to clipboard');
	};

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		if (isEventMessage(savedItem)) {
			this.viewStore.activePanel = Panel.Messages;
			if (!this.viewStore.isExpanded(Panel.Messages)) {
				this.viewStore.expandPanel(Panel.Messages);
			}
			this.messagesStore.onMessageSelect(savedItem);
		} else {
			this.viewStore.activePanel = Panel.Events;
			if (!this.viewStore.isExpanded(Panel.Events)) {
				this.viewStore.expandPanel(Panel.Events);
			}
			this.eventsStore.goToEvent(savedItem);
		}
	};

	@action
	public onSearchResultItemSelect = async (
		resultItem: EventTreeNode | EventAction | EventMessage,
		isNewWorkspace?: boolean,
	) => {
		if (isNewWorkspace) {
			let initialWorkspaceState: WorkspaceInitialState = {};

			if (isEventMessage(resultItem)) {
				initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByMessage(
					this.searchStore.currentSearch as MessagesSearchResult,
					timestampToNumber(resultItem.timestamp),
					resultItem,
				);
			} else {
				initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByEvent(
					timestampToNumber(resultItem.startTimestamp),
					resultItem,
				);
			}

			const newWorkspace = await this.workspacesStore.createWorkspace(initialWorkspaceState);
			this.workspacesStore.addWorkspace(newWorkspace);
		} else {
			this.onSavedItemSelect(resultItem);
		}
	};

	public onFilterByParentEvent = (parentEvent: EventTreeNode) => {
		this.searchStore.filterEventsByParent(
			parentEvent.eventId,
			timestampToNumber(parentEvent.startTimestamp),
		);

		this.viewStore.setActivePanel(Panel.Search);
		if (!this.viewStore.isExpanded(Panel.Search)) {
			this.viewStore.expandPanel(Panel.Search);
		}
	};

	private onMessagesBookmarkChange = (bookmarks: MessageBookmark[]) => {
		this.messagesStore.onBookmarksChange(bookmarks.map(bookmark => bookmark.item));
	};

	private onSessionHistoryChange = (sessions: Session[]) => {
		this.messagesStore.onSessionHistoryChange(sessions.map(s => s.session));
	};

	public dispose = () => {
		this.messagesStore.dispose();
		this.eventsStore.dispose();
		this.saveWorkspaceState.cancel();
	};

	private saveWorkspaceState = debounce(() => {
		const stateToSave: SavedWorkspaceState = {
			id: this.id,
			timestamp: Date.now(),
			...toJS(this.state, { recurseEverything: true }),
		};
		console.log(stateToSave);
		this.api.indexedDb.updateDbStoreItem(IndexedDbStores.WORKSPACES_STATE, stateToSave);
	}, 3000);
}
