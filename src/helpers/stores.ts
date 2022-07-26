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

import { BookmarksStore } from 'modules/bookmarks/stores/BookmarksStore';
import { SearchStore } from 'modules/search/stores/SearchStore';
import EventsStore from '../modules/events/stores/EventsStore';
import MessagesStore from '../stores/messages/MessagesStore';

export const isEventsStore = (object: unknown): object is EventsStore =>
	object instanceof EventsStore;

export const isMessagesStore = (object: unknown): object is MessagesStore =>
	object instanceof MessagesStore;

export const isSearchStore = (object: unknown): object is SearchStore =>
	object instanceof SearchStore;

export const isBookmarksStore = (object: unknown): object is BookmarksStore =>
	object instanceof isBookmarksStore;
