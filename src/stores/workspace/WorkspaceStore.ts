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
import { SearchStore } from 'modules/search/stores/SearchStore';
import { IEventsStore, IFilterConfigStore, ISearchStore } from 'models/Stores';
import { Panel } from 'models/Panel';
import { SessionHistoryStore } from 'modules/messages/stores//SessionHistoryStore';
import MessageDisplayRulesStore from 'modules/messages/stores/MessageDisplayRulesStore';
import MessagesStore, {
	MessagesStoreDefaultStateType,
	MessagesStoreURLState,
} from 'modules/messages/stores/MessagesStore';
import EventsStore, {
	EventStoreDefaultStateType,
	EventStoreURLState,
} from '../../modules/events/stores/EventsStore';
import ApiSchema from '../../api/ApiSchema';
import WorkspaceViewStore from './WorkspaceViewStore';
import { EventMessage } from '../../models/EventMessage';
import { ActionType, EventAction, EventTreeNode } from '../../models/EventAction';
import { isEventMessage } from '../../helpers/message';
import { TimeRange } from '../../models/Timestamp';
import WorkspacesStore, { WorkspacesUrlState } from './WorkspacesStore';
import { WorkspacePanelsLayout } from '../../components/workspace/WorkspaceSplitter';
import { getRangeFromTimestamp, timestampToNumber } from '../../helpers/date';
import { getObjectKeys } from '../../helpers/object';

export interface WorkspaceUrlState {
	events: Partial<EventStoreURLState>;
	messages: Partial<MessagesStoreURLState>;
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
	public eventsStore: IEventsStore;

	public messagesStore: MessagesStore;

	public viewStore: WorkspaceViewStore;

	public searchStore: ISearchStore;

	public id = nanoid();

	constructor(
		private workspacesStore: WorkspacesStore,
		private sessionsStore: SessionHistoryStore,
		private filterConfigStore: IFilterConfigStore,
		private messageDisplayRulesStore: MessageDisplayRulesStore,
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
			this.filterConfigStore,
			this.api,
			messageDisplayRulesStore,
			initialState.messages,
		);

		reaction(() => this.eventsStore.selectedNode, this.messagesStore.onSelectedEventChange);
	}

	@computed
	public get isActive(): boolean {
		return this.workspacesStore.activeWorkspace === this;
	}

	public getWorkspaceState = (): WorkspacesUrlState => {
		const eventStoreState = toJS(this.eventsStore.urlState);

		const messagesStoreState = {
			timestampFrom: this.messagesStore.filterStore.params.timestampFrom,
			timestampTo: this.messagesStore.filterStore.params.timestampTo,
			streams: this.messagesStore.filterStore.params.streams,
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
				timeRange: eventStoreState.range,
				interval: eventStoreState.interval,
				layout: this.viewStore.panelsLayout,
			}),
		];
	};

	@action
	public onSavedItemSelect = (savedItem: EventTreeNode | EventAction | EventMessage) => {
		if (isEventMessage(savedItem)) {
			this.viewStore.activePanel = Panel.Messages;
			this.messagesStore.onMessageSelect(savedItem);
		} else {
			this.viewStore.activePanel = Panel.Events;
			this.eventsStore.goToEvent(savedItem);
		}
	};

	@action
	public onSearchResultItemSelect = (
		resultItem: EventTreeNode | EventAction | EventMessage,
		isNewWorkspace?: boolean,
	) => {
		if (isNewWorkspace) {
			let initialWorkspaceState: WorkspaceInitialState = {};

			if (isEventMessage(resultItem)) {
				initialWorkspaceState = this.workspacesStore.getInitialWorkspaceByMessage(
					timestampToNumber(resultItem.timestamp),
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
		} else {
			this.onSavedItemSelect(resultItem);
		}
	};

	@action
	public onSearchResultGroupSelect = (timestamp: number, resultType: ActionType) => {
		switch (resultType) {
			case ActionType.EVENT_ACTION:
				this.eventsStore.applyFilter(
					undefined,
					getRangeFromTimestamp(timestamp, this.eventsStore.urlState.interval!),
				);
				break;
			case ActionType.MESSAGE:
				this.messagesStore.filterStore.setMessagesFilter(
					{
						streams: this.searchStore.currentSearch?.request.state.stream ?? [],
						timestampFrom: null,
						timestampTo: timestamp,
					},
					null,
				);
				break;
			default:
				throw new Error(`Unhandled result type ${resultType}`);
		}
	};

	public onFilterByParentEvent = (parentEvent: EventTreeNode) => {
		this.searchStore.stopSearch();
		this.searchStore.setFormType('event');
		this.searchStore.updateForm({
			parentEvent: parentEvent.eventId,
			startTimestamp: timestampToNumber(parentEvent.startTimestamp),
		});

		// TODO: expand search panel if it's collapsed & set active panel
	};

	public dispose = () => {
		this.messagesStore.dispose();
		this.eventsStore.dispose();
		this.searchStore.dispose();
	};
}
