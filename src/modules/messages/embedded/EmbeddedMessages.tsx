/** ****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

import { useState } from 'react';
import api from 'api/index';
import { FilterConfigStore } from 'stores/FilterConfigStore';
import MessagesStore from '../stores/MessagesStore';
import { MessagesPanelBase } from '../components/MessagesPanel';
import { MessagesStoreProvider } from '../components/MessagesStoreProvider';
import 'styles/workspace.scss';

const EmbeddedMessages = () => {
	const [store] = useState(() => {
		const searchParams = new URLSearchParams(window.location.search);

		const messagesUrlState = searchParams.get('messages');

		if (!messagesUrlState) {
			throw new Error("The query parameter 'Messages' was not passed");
		}
		const state = JSON.parse(window.atob(messagesUrlState));
		return new MessagesStore(new FilterConfigStore(api), api, state, { isLive: true });
	});
	return (
		<MessagesStoreProvider value={store}>
			<MessagesPanelBase />
		</MessagesStoreProvider>
	);
};

export default EmbeddedMessages;
