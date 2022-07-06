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

import { action, computed, observable, reaction } from 'mobx';
import { keyForMessage } from '../../helpers/keys';
import { EventMessage } from '../../models/EventMessage';
import MessageDisplayRulesStore from '../MessageDisplayRulesStore';
import MessagesStore from './MessagesStore';
import { SavedMessageViewType } from './SavedMessageViewType';

class MessagesViewStore {
	messageDisplayRulesStore: MessageDisplayRulesStore;

	messagesStore: MessagesStore;

	constructor(messageDispalyRulesStore: MessageDisplayRulesStore, messagesStore: MessagesStore) {
		this.messageDisplayRulesStore = messageDispalyRulesStore;
		this.messagesStore = messagesStore;
		reaction(() => this.filter, this.resetSavedViewTypes);
	}

	@computed
	private get filter() {
		return this.messagesStore.filterStore.filter;
	}

	@observable
	public savedViewTypes = new Map<string, SavedMessageViewType>();

	@observable
	public expandedMessages: String[] = [];

	@action
	public getSavedViewType = (
		message: EventMessage,
		parsedMessageId: string,
	): SavedMessageViewType => {
		const key = keyForMessage(parsedMessageId);
		if (this.savedViewTypes.has(key)) {
			return this.savedViewTypes.get(key) as SavedMessageViewType;
		}
		this.savedViewTypes.set(
			key,
			new SavedMessageViewType(message, parsedMessageId, this.messageDisplayRulesStore),
		);
		return this.savedViewTypes.get(key) as SavedMessageViewType;
	};

	@action
	private resetSavedViewTypes = () => {
		this.savedViewTypes.clear();
	};

	@action
	public setExpandedMessage = (message: EventMessage) => {
		if (this.expandedMessages.includes(message.id)) {
			this.expandedMessages.splice(this.expandedMessages.indexOf(message.id));
		} else {
			this.expandedMessages.push(message.id);
		}
	};
}

export default MessagesViewStore;
