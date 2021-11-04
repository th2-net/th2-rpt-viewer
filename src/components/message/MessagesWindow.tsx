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

import React from 'react';
import { observer } from 'mobx-react-lite';
import MessagesWindowHeader from './MessagesWindowHeader';
import { useMessagesWorkspaceStore, useActivePanel } from '../../hooks';
import MessagesCardList from './message-card-list/MessagesCardList';
import AttachedMessagesSelection from './AttachedMessagesSelection';

const MessagesWindow = () => {
	const messagesStore = useMessagesWorkspaceStore();

	const { ref: panelRef } = useActivePanel(messagesStore);

	return (
		<div className='window' ref={panelRef}>
			<div className='window__controls'>
				<MessagesWindowHeader />
			</div>
			<div className='window__body'>
				<AttachedMessagesSelection />
				<MessagesCardList />
			</div>
		</div>
	);
};

export default observer(MessagesWindow);
