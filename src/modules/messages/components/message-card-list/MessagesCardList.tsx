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
import SplashScreen from 'components/SplashScreen';
import Empty from 'components/util/Empty';
import StateSaverProvider from 'components/util/StateSaverProvider';
import { EventMessage } from 'models/EventMessage';
import CardDisplayType from 'models/util/CardDisplayType';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import MessagesVirtualizedList from './MessagesVirtualizedList';
import MessageCardListItem from '../message-card/MessageCardListItem';
import 'styles/messages.scss';

const ERROR_MESSAGE = 'Error occured while loading messages';
const EMPTY_MESSAGE = 'No messages';

function MessageCardList() {
	const messagesStore = useMessagesStore();
	const messagesDataStore = useMessagesDataStore();

	const renderMessage = useCallback(
		(message: EventMessage, displayType: CardDisplayType) => (
			<MessageCardListItem message={message} displayType={displayType} />
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
