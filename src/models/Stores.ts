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

import { Bookmark, EventBookmark, MessageBookmark } from 'modules/bookmarks/models/Bookmarks';
import { SearchPanelType } from 'modules/search/models/Search';
import { SearchHistory, SearchPanelFormState } from 'modules/search/stores/SearchStore';
import { EventStoreURLState } from 'modules/events/stores/EventsStore';
import { TimeRange } from 'models/Timestamp';
import EventsFilter from 'models/filter/EventsFilter';
import MessagesFilter from 'models/filter/MessagesFilter';
import { DbData } from '../api/indexedDb';
import { EventsFiltersInfo, MessagesFilterInfo, MessagesSSEParams } from '../api/sse';
import { EventTreeNode, EventAction } from './EventAction';
import { MessageSSEEventListeners } from '../stores/SSEChannel/MessagesSSEChannel';
import { EventMessage } from './EventMessage';

export interface IBookmarksStore {
	messages: MessageBookmark[];
	events: EventBookmark[];
	bookmarks: Bookmark[];
	isLoadingBookmarks: boolean;
	toggleMessagePin: (message: EventMessage) => void;
	toggleEventPin: (message: EventTreeNode) => void;
	syncData: (unsavedData?: DbData) => void;
}

export interface IFilterConfigStore {
	isMessageFiltersLoading: boolean;
	isEventFiltersLoading: boolean;
	eventFilterInfo: EventsFiltersInfo[];
	messagesFilterInfo: MessagesFilterInfo[];
	messageSessions: string[];
	eventFilters: EventsFilter | null;
	getEventFilters: () => Promise<EventsFilter | null>;
	messageFilters: MessagesFilter | null;
	getMessageFilters: () => Promise<MessagesFilter | null>;
	getMessageSessions: () => Promise<string[]>;
}

export interface ISearchStore {
	currentSearch: SearchHistory | null;
	updateForm: (stateUpdate: Partial<SearchPanelFormState>) => void;
	dispose: () => void;
	stopSearch: () => void;
	setFormType: (type: SearchPanelType) => void;

	pauseSearch: () => void;
	isSearching: boolean;
	startSearch: (loadMore?: boolean) => void;
}

export interface MessagesDataStore {
	messages: EventMessage[];
	loadMessages: (
		nextChannelListeners?: Partial<MessageSSEEventListeners>,
		prevChannelListeners?: Partial<MessageSSEEventListeners>,
	) => Promise<void>;
	onNextChannelResponse: (messages: EventMessage[]) => void;
	onPrevChannelResponse: (messages: EventMessage[]) => void;
	resetState: () => void;
	getFilterParams: () => MessagesSSEParams;
	getNextMessages: () => Promise<EventMessage[]>;
}

export interface IEventsStore {
	renderedEvents: EventTreeNode[];
	selectedNode: EventTreeNode | null;
	goToEvent: (event: EventAction | EventTreeNode) => void;
	dispose: () => void;
	urlState: EventStoreURLState;
	applyFilter: (filter?: EventsFilter, timeRange?: TimeRange) => void;
}
