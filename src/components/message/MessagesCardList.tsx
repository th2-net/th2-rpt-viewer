/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-new-wrappers */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import StateSaverProvider from '../util/StateSaverProvider';
import { VirtualizedList } from '../VirtualizedList';
import { createBemElement } from '../../helpers/styleCreators';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import SkeletonedMessageCardListItem from './SkeletonedMessageCardListItem';
import Empty from '../Empty';
import SplashScreen from '../SplashScreen';
import MessagesScrollContainer from './MessagesScrollContainer';
import '../../styles/messages.scss';

const MessageCardList = () => {
	const { messagesStore, filterStore } = useEventWindowStore();

	const renderMessage = (index: number) => {
		const id = messagesStore.messagesIds[index];

		return (
			<SkeletonedMessageCardListItem id={id}/>
		);
	};

	const listClassName = createBemElement(
		'messages',
		'list',
		filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	if (messagesStore.isLoading) {
		return <SplashScreen />;
	}

	if (!messagesStore.isLoading && messagesStore.messagesIds.length === 0) {
		return <Empty description="No messages" />;
	}

	return (
		<div className="messages">
			<div className={listClassName}>
				{
					filterStore.isFilterApplied ? (
						<div className="messages__filter-info">
							{/* {selectedStore.messages} Messages Filtered */}
						</div>
					) : null
				}
				<StateSaverProvider>
					<VirtualizedList
						className="messages__list"
						rowCount={messagesStore.messagesIds.length}
						scrolledIndex={messagesStore.scrolledIndex}
						itemRenderer={renderMessage}
						overscan={0}
						ScrollContainer={MessagesScrollContainer}
						initialTopMostItemIndex={messagesStore.scrolledIndex
							? messagesStore.scrolledIndex.valueOf() : undefined}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
};

export default observer(MessageCardList, { forwardRef: true });
