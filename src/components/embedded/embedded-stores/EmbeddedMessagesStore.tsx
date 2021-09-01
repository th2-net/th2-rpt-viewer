/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
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
import moment from 'moment';
import { action, reaction, observable } from 'mobx';
import * as queryString from 'querystring';
import { EventMessage } from '../../../models/EventMessage';
import { MessageFilterState } from '../../search-panel/SearchPanelFilters';
import MessagesFilter from '../../../models/filter/MessagesFilter';
import ApiSchema from '../../../api/ApiSchema';
import { MessagesStoreURLState } from '../../../stores/messages/MessagesStore';
import EmbeddedMessagesDataProviderStore from './EmbeddedMessagesDataProviderStore';
import { MessagesSSEParams } from '../../../api/sse';

function getDefaultMessagesFilter(): MessagesFilter {
	return {
		timestampFrom: null,
		timestampTo: moment.utc().valueOf(),
		streams: [],
	};
}

type MessagesStoreDefaultState = MessagesStoreURLState & {
	targetMessage?: EventMessage;
};

export type MessagesStoreDefaultStateType = MessagesStoreDefaultState | string | null | undefined;

export default class EmbeddedMessagesStore {
	public dataStore = new EmbeddedMessagesDataProviderStore(this, this.api);

	@observable
	public hoveredMessage: EventMessage | null = null;

	@observable
	public selectedMessageId: String | null = null;

	@observable
	public scrolledIndex: Number | null = null;

	@observable
	public highlightedMessageId: String | null = null;

	@observable
	public detailedRawMessagesIds: Array<string> = [];

	@observable
	public beautifiedMessages: Array<string> = [];

	@observable sseMessagesFilter: MessageFilterState | null = null;

	@observable filter: MessagesFilter = getDefaultMessagesFilter();

	constructor(private api: ApiSchema) {
		reaction(() => this.selectedMessageId, this.onSelectedMessageIdChange);
	}

	public get filterParams(): MessagesSSEParams {
		const searchParams = queryString.parse(window.location.search);
		delete searchParams['?viewMode'];
		return (searchParams as unknown) as MessagesSSEParams;
	}

	@action
	public scrollToMessage = async (messageId: string) => {
		const messageIndex = this.dataStore.messages.findIndex(
			(m: { messageId: string }) => m.messageId === messageId,
		);
		if (messageIndex !== -1) {
			this.scrolledIndex = new Number(messageIndex);
		}
	};

	@action
	private onSelectedMessageIdChange = (selectedMessageId: String | null) => {
		if (selectedMessageId !== null) {
			this.scrollToMessage(selectedMessageId.valueOf());
		}
	};
}
