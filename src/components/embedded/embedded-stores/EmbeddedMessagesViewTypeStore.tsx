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
import { SavedMessageViewType } from 'modules/messages/stores/SavedMessageViewType';
import { keyForMessage } from 'modules/messages/helpers/keys';
import { EventMessage } from 'models/EventMessage';

class EmbeddedMessagesViewTypeStore {
	@observable
	public savedViewTypes = new Map<string, SavedMessageViewType>();

	@action
	public getSavedViewType = (message: EventMessage): SavedMessageViewType => {
		const key = keyForMessage(message.id);
		if (this.savedViewTypes.has(key)) {
			return this.savedViewTypes.get(key) as SavedMessageViewType;
		}
		this.savedViewTypes.set(key, new SavedMessageViewType(message));

		return this.savedViewTypes.get(key) as SavedMessageViewType;
	};

	@action
	public resetSavedViewTypes = () => {
		this.savedViewTypes.clear();
	};
}

export default EmbeddedMessagesViewTypeStore;
