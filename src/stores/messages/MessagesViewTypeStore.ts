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

import { action, observable } from 'mobx';
import { keyForMessage } from '../../helpers/keys';
import { EventMessage, MessageViewType } from '../../models/EventMessage';

class MessagesViewTypeStore {
	@observable
	public savedViewTypes = new Map<string, Map<string, MessageViewType>>();

	@action
	public getSavedViewType = (message: EventMessage) => {
		const key = keyForMessage(message.id);
		if (this.savedViewTypes.has(key)) {
			return this.savedViewTypes.get(key) as Map<string, MessageViewType>;
		}
		this.savedViewTypes.set(key, this.getViewTypes(message));
		return this.savedViewTypes.get(key) as Map<string, MessageViewType>;
	};

	@action
	public setViewType = (vt: MessageViewType, messageId: string, parsedMessageId: string) => {
		this.savedViewTypes.get(keyForMessage(messageId))?.set(parsedMessageId, vt);
	};

	@action
	private getViewTypes = (message: EventMessage) => {
		const viewTypes: Map<string, MessageViewType> = new Map();
		viewTypes.set(message.id, MessageViewType.ASCII);
		if (message.parsedMessages)
			message.parsedMessages.forEach(parsedMessage =>
				viewTypes.set(parsedMessage.id, MessageViewType.JSON),
			);
		return viewTypes;
	};

	@action
	public resetSavedViewTypes = () => {
		this.savedViewTypes.clear();
	};
}

export default MessagesViewTypeStore;
