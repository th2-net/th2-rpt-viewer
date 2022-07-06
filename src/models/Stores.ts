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
import {
	EventFilterState,
	MessageFilterState,
	SearchPanelType,
} from 'modules/search/models/Search';
import { SearchHistory, SearchPanelFormState } from 'modules/search/stores/SearchStore';
import { DbData } from '../api/indexedDb';
import { EventsFiltersInfo, MessagesFilterInfo, MessagesSSEParams } from '../api/sse';
import { EventTreeNode } from './EventAction';
import { MessageSSEEventListeners } from '../stores/SSEChannel/MessagesSSEChannel';
import { EventMessage, EventMessageItem } from './EventMessage';

export interface IBookmarksStore {
	messages: MessageBookmark[];
	events: EventBookmark[];
	bookmarks: Bookmark[];
	isLoadingBookmarks: boolean;
	toggleMessagePin: (message: EventMessageItem) => void;
	toggleEventPin: (message: EventTreeNode) => void;
	syncData: (unsavedData?: DbData) => void;
}

export interface IFilterConfigStore {
	isMessageFiltersLoading: boolean;
	isEventFiltersLoading: boolean;
	eventFilterInfo: EventsFiltersInfo[];
	messagesFilterInfo: MessagesFilterInfo[];
	messageSessions: string[];
	eventFilters: EventFilterState | null;
	messageFilters: MessageFilterState | null;
	getMessageFilters: () => Promise<MessageFilterState | null>;
	getEventFilters: () => Promise<EventFilterState | null>;
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

export interface IEventsStore {
	
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
