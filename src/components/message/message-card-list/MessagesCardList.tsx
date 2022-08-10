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

import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import MessagesVirtualizedList from './MessagesVirtualizedList';
import SplashScreen from '../../SplashScreen';
import Empty from '../../util/Empty';
import { useMessagesDataStore, useMessagesStore } from '../../../hooks';
import StateSaverProvider from '../../util/StateSaverProvider';
import { EventMessage } from '../../../models/EventMessage';
import CardDisplayType from '../../../models/util/CardDisplayType';
import MessageCard from '../message-card/MessageCard';
import '../../../styles/messages.scss';

const ERROR_MESSAGE = 'Error occured while loading messages';
const EMPTY_MESSAGE = 'No messages';

function MessageCardList() {
	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();

	const renderMessage = useCallback(
		(message: EventMessage, displayType: CardDisplayType) => (
			<MessageCard message={message} displayType={displayType} key={message.id} />
		),
		[],
	);

	if (messagesDataStore.isError) {
		return <Empty description={ERROR_MESSAGE} />;
	}

	const isEmpty = messagesDataStore.messages.length === 0;

	const isLoading =
		messagesDataStore.isLoading ||
		messagesStore.isLoadingAttachedMessages ||
		messagesStore.isFilteringTargetMessages ||
		messagesDataStore.updateStore.isActive;

	if (isEmpty && isLoading) {
		return <SplashScreen />;
	}

	if (isEmpty && !isLoading) {
		return <Empty description={EMPTY_MESSAGE} />;
	}

	return (
		<div className='messages-list'>
			<StateSaverProvider>
				<MessagesVirtualizedList
					renderMessage={renderMessage}
					overscan={0}
					loadNextMessages={messagesDataStore.getNextMessages}
					loadPrevMessages={messagesDataStore.getPreviousMessages}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(MessageCardList, { forwardRef: true });
