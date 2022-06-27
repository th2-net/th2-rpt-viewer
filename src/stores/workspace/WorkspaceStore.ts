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

import { action, computed, observable, reaction, toJS } from 'mobx';
import { nanoid } from 'nanoid';
import { SearchStore } from 'modules/search/stores/SearchStore';
import { IFilterConfigStore } from 'models/Stores';
import MessagesStore, {
	MessagesStoreDefaultStateType,
	MessagesStoreURLState,
} from '../messages/MessagesStore';
import EventsStore, { EventStoreDefaultStateType, EventStoreURLState } from '../events/EventsStore';
import ApiSchema from '../../api/ApiSchema';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { ActionType, EventAction, EventTreeNode } from '../../models/EventAction';
import { sortMessagesByTimestamp } from '../../helpers/message';
import { isEventMessage } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import WorkspacesStore, { WorkspacesUrlState } from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { SessionHistoryStore } from '../messages/SessionHistoryStore';
import { getRangeFromTimestamp } from '../../helpers/date';
import { isAbortError } from '../../helpers/fetch';
import { getObjectKeys } from '../../helpers/object';
import MessagesViewTypesStore from '../messages/MessagesViewTypesStore';
import MessageDisplayRulesStore from '../MessageDisplayRulesStore';

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState> | string;
	messages: Partial<MessagesStoreURLState> | string;
	timeRange?: TimeRange;
	layout: WorkspacePanelsLayout;
}

export type WorkspaceInitialState = Partial<{
	events: EventStoreDefaultStateType;
	messages: MessagesStoreDefaultStateType;
	timeRange?: TimeRange;
	interval: number | null;
	layout: WorkspacePanelsLayout;
}>;

export default class WorkspaceStore {
	public eventsStore: EventsStore;

	public messagesStore: MessagesStore;

	public messageViewTypesStore: MessagesViewTypesStore;

	public viewStore: WorkspaceViewStore;

	public searchStore: SearchStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private sessionsStore: SessionHistoryStore,
		private messageDisplayRulesStore: MessageDisplayRulesStore,
		private filterConfigStore: IFilterConfigStore,
		private api: ApiSchema,
		initialState: WorkspaceInitialState,
	) {
		this.searchStore = new SearchStore(
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
			this,
			this.filterConfigStore,
			this.api,
			this.sessionsStore,
			initialState.messages,
		);

		this.messageViewTypesStore = new MessagesViewTypesStore(
			this.messageDisplayRulesStore,
			this.messagesStore,
		);

		reaction(() => this.attachedMessagesIds, this.getAttachedMessages);

		reaction(() => this.eventsStore.selectedEvent, this.onSelectedEventChange);
	}

	@observable
	public attachedMessagesIds: Array<string> = [];

	@observable
	public attachedMessages: Array<EventMessage> = [];

	@observable
	public isLoadingAttachedMessages = false;

	@computed
	public get isActive(): boolean {
		return this.workspacesStore.activeWorkspace === this;
	}

	public getWorkspaceState = (): WorkspacesUrlState => {
		const eventStoreState = {
			filter: this.eventsStore.filterStore.filter || undefined,
			range: this.eventsStore.filterStore.range,
			panelArea: this.eventsStore.viewStore.eventsPanelArea,
			search:
				this.eventsStore.searchStore.tokens.length > 0
					? this.eventsStore.searchStore.tokens.map(t => t.pattern)
					: undefined,
			selectedEventId: this.eventsStore.selectedNode?.eventId,
			flattenedListView: this.eventsStore.viewStore.flattenedListView,
		};

		const messagesStoreState = {
			timestampFrom: this.messagesStore.filterStore.filter.timestampFrom,
			timestampTo: this.messagesStore.filterStore.filter.timestampTo,
			streams: this.messagesStore.filterStore.filter.streams,
			isSoftFilter: this.messagesStore.filterStore.isSoftFilter,
			sse: this.messagesStore.filterStore.sseMessagesFilter,
		};

		getObjectKeys(eventStoreState).forEach(key => {
			if (eventStoreState[key] === undefined) {
				delete eventStoreState[key];
			}
		});

		getObjectKeys(messagesStoreState).forEach(key => {
			if (messagesStoreState[key] === undefined) {
				delete messagesStoreState[key];
			}
		});

		return [
			toJS({
				events: eventStoreState,
				messages: messagesStoreState,
				timeRange: this.eventsStore.filterStore.range,
				interval: this.eventsStore.filterStore.interval,
				layout: this.viewStore.panelsLayout,
			}),
		];
	};

	@action
	private setAttachedMessagesIds = (attachedMessageIds: string[]) => {
		this.attachedMessagesIds = [...new Set(attachedMessageIds)];
	};

	private attachedMessagesAC: AbortController | null = null;

	@action
	private getAttachedMessages = async (attachedMessagesIds: string[]) => {
		this.isLoadingAttachedMessages = true;
		if (this.attachedMessagesAC) {
			this.attachedMessagesAC.abort();
		}
		this.attachedMessagesAC = new AbortController();
		try {
			const cachedMessages = this.attachedMessages.filter(message =>
				attachedMessagesIds.includes(message.id),
			);
			const messagesToLoad = attachedMessagesIds.filter(
				messageId => cachedMessages.findIndex(message => message.id === messageId) === -1,
			);
			const messages = await Promise.all(
				messagesToLoad.map(id => this.api.messages.getMessage(id, this.attachedMessagesAC?.signal)),
			);
			this.attachedMessages = sortMessagesByTimestamp(
				[...cachedMessages, ...messages].filter(Boolean),
			);
		} catch (error) {
			if (!isAbortError(error)) {
				console.error('Error while loading attached messages', error);
			}
			this.attachedMessages = [];
		} finally {
			this.attachedMessagesAC = null;
			this.isLoadingAttachedMessages = false;
		}
	};

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		if (isEventMessage(savedItem)) {
			this.messagesStore.exportStore.disableExport();
			this.viewStore.activePanel = this.messagesStore;
			this.messagesStore.onMessageSelect(savedItem);
		} else {
			this.viewStore.activePanel = this.eventsStore;
			this.eventsStore.goToEvent(savedItem);
		}
	};

	@action
	private onSelectedEventChange = (selectedEvent: EventAction | null) => {
		this.setAttachedMessagesIds(selectedEvent ? selectedEvent.attachedMessageIds : []);
	};

	@action
	public onSearchResultItemSelect = (resultItem: EventTreeNode | EventAction | EventMessage) => {
		this.onSavedItemSelect(resultItem);
	};

	@action
	public onSearchResultGroupSelect = (timestamp: number, resultType: ActionType) => {
		switch (resultType) {
			case ActionType.EVENT_TREE_NODE:
			case ActionType.EVENT_ACTION:
				this.eventsStore.clearFilter();
				this.eventsStore.filterStore.setEventsRange(
					getRangeFromTimestamp(timestamp, this.eventsStore.filterStore.interval),
				);
				if (this.eventsStore.filterStore.filter) {
					this.eventsStore.applyFilter(this.eventsStore.filterStore.filter);
				}
				break;
			case ActionType.MESSAGE:
				this.messagesStore.filterStore.setMessagesFilter(
					{
						streams: this.searchStore.currentSearch?.request.state.stream ?? [],
						timestampFrom: null,
						timestampTo: timestamp,
					},
					null,
					false,
				);
				break;
			default:
				break;
		}
	};

	public dispose = () => {
		// Delete all subscriptions and cancel pending requests
		this.messagesStore.dispose();
		this.eventsStore.dispose();
	};
}
