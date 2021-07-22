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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import MessageCard from '../message-card/MessageCard';
import MessagesVirtualizedList from './MessagesVirtualizedList';
import SplashScreen from '../../SplashScreen';
import Empty from '../../util/Empty';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../../hooks';
import StateSaverProvider from '../../util/StateSaverProvider';
import { EventMessage } from '../../../models/EventMessage';
import '../../../styles/messages.scss';

export type MessagesHeights = { [index: number]: number };

function MessageCardList() {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const renderMsg = (index: number, message: EventMessage) => {
		return <MessageCard isEmbedded={false} message={message} />;
	};

	if (
		messagesDataStore.messages.length === 0 &&
		(messagesDataStore.isLoadingNextMessages || messagesDataStore.isLoadingPreviousMessages)
	) {
		return <SplashScreen />;
	}

	if (messagesDataStore.isError) {
		return (
			<Empty
				description='Error occured while loading messages'
				descriptionStyles={{ position: 'relative', bottom: '6px' }}
			/>
		);
	}

	if (
		!(messagesDataStore.isLoadingNextMessages || messagesDataStore.isLoadingPreviousMessages) &&
		messagesDataStore.messages.length === 0
	) {
		if (messagesDataStore.isError === false) {
			return (
				<Empty
					description='No messages'
					descriptionStyles={{ position: 'relative', bottom: '6px' }}
				/>
			);
		}
	}

	return (
		<div className='messages-list'>
			<StateSaverProvider>
				<MessagesVirtualizedList
					className='messages-list__items'
					rowCount={messagesDataStore.messages.length}
					scrolledIndex={messagesStore.scrolledIndex}
					itemRenderer={renderMsg}
					overscan={0}
					loadNextMessages={messagesDataStore.getNextMessages}
					loadPrevMessages={messagesDataStore.getPreviousMessages}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(MessageCardList, { forwardRef: true });
