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

import { observable } from 'mobx';
import MessagesStore, { MessagesStoreURLState } from './MessagesStore';
import EventsStore, { EventStoreURLState } from './EventsStore';
import ApiSchema from '../api/ApiSchema';
import { SelectedStore } from './SelectedStore';
import WorkspaceViewStore from './WorkspaceViewStore';

export type EventStoreDefaultStateType = EventsStore | EventStoreURLState | null;
export type MessagesStoreDefaultStateType = MessagesStore | null;

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState>;
	messages: Partial<MessagesStoreURLState>;
}

export default class WorkspaceStore {
	@observable eventsStore: EventsStore;

	@observable messagesStore: MessagesStore;

	@observable viewStore = new WorkspaceViewStore();

	constructor(
		private selectedStore: SelectedStore,
		private api: ApiSchema,
		eventDefaultState: EventStoreDefaultStateType = null,
		messagesDefaultState: MessagesStoreDefaultStateType = null,
	) {
		this.eventsStore = new EventsStore(this.api, this.selectedStore, eventDefaultState);
		this.messagesStore = new MessagesStore(this.api, this.selectedStore, messagesDefaultState);
	}
}
