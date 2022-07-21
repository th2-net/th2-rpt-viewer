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
import { Observer, observer } from 'mobx-react-lite';
import { Virtuoso, VirtuosoHandle, ListItem } from 'react-virtuoso';
import moment from 'moment';
import { isEventMessage } from 'helpers/event';
import { SearchDirection } from 'models/search/SearchDirection';
import { EventMessage } from '../../../models/EventMessage';
import { useMessagesStore, useDebouncedCallback, useMessagesDataStore } from '../../../hooks';
import { raf } from '../../../helpers/raf';
import { SSEHeartbeat } from '../../../api/sse';
import { formatTime } from '../../../helpers/date';

interface Props {
	renderMessage: (message: EventMessage) => React.ReactElement;
	/*
		 Number objects is used here because in some cases (eg one message / action was
		 selected several times by different entities)
		 We can't understand that we need to scroll to the selected entity again when
		 we are comparing primitive numbers.
		 Objects and reference comparison is the only way to handle numbers changing in this case.
	 */
	overscan?: number;
	loadNextMessages: () => Promise<EventMessage[]>;
	loadPrevMessages: () => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesStore();
	const {
		messages,
		searchChannelNext,
		searchChannelPrev,
		startIndex,
		noMatchingMessagesNext,
		noMatchingMessagesPrev,
		keepLoading,
		isLoadingNextMessages,
		isLoadingPreviousMessages,
		onNextChannelResponse,
		onPrevChannelResponse,
		prevLoadHeartbeat,
		nextLoadHeartbeat,
		updateStore,
	} = useMessagesDataStore();

	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const { overscan = 3, renderMessage, loadPrevMessages, loadNextMessages } = props;

	const [[firstPrevChunkIsLoaded, firstNextChunkIsLoaded], setLoadedChunks] = React.useState<
		[boolean, boolean]
	>([false, false]);

	React.useEffect(() => {
		if (updateStore.isActive && virtuoso.current) {
			virtuoso.current.scrollToIndex(0);
		}
	}, [updateStore.isActive]);

	React.useEffect(() => {
		if (!searchChannelNext?.isLoading) setLoadedChunks(loadedChunks => [true, loadedChunks[1]]);
		if (!searchChannelPrev?.isLoading) setLoadedChunks(loadedChunks => [loadedChunks[0], true]);
	}, [searchChannelNext?.isLoading, searchChannelPrev?.isLoading]);

	React.useEffect(() => {
		const selectedMessageId = messageStore.selectedMessageId?.valueOf();
		if (selectedMessageId) {
			raf(() => {
				const index = messageStore.dataStore.messages.findIndex(m => m.id === selectedMessageId);
				if (index !== -1) virtuoso.current?.scrollToIndex({ index, align: 'center' });
			}, 3);
		}
	}, [
		messageStore.selectedMessageId,
		messageStore,
		firstPrevChunkIsLoaded,
		firstNextChunkIsLoaded,
	]);

	const debouncedScrollHandler = useDebouncedCallback(
		(event: React.UIEvent<'div'>, wheelScrollDirection?: 'next' | 'previous') => {
			const scroller = event.target;
			if (scroller instanceof Element) {
				const isStartReached = scroller.scrollTop === 0;
				const isEndReached = scroller.scrollHeight - scroller.scrollTop === scroller.clientHeight;
				if (
					isStartReached &&
					searchChannelNext &&
					!searchChannelNext.isLoading &&
					!searchChannelNext.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'next')
				) {
					loadNextMessages().then(onNextChannelResponse);
				}

				if (
					isEndReached &&
					searchChannelPrev &&
					!searchChannelPrev.isLoading &&
					!searchChannelPrev.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'previous')
				) {
					loadPrevMessages().then(onPrevChannelResponse);
				}
			}
		},
		100,
	);

	const onScroll = (event: React.UIEvent<'div'>) => {
		event.persist();
		debouncedScrollHandler(event);
	};

	const onWheel: React.WheelEventHandler<'div'> = event => {
		event.persist();
		debouncedScrollHandler(event, event.deltaY < 0 ? 'next' : 'previous');
	};

	const onMessagesRendered = useDebouncedCallback((renderedMessages: ListItem<EventMessage>[]) => {
		messageStore.setRenderedItems(
			renderedMessages.map(listItem => listItem.data).filter(isEventMessage),
		);
	}, 800);

	const computeItemKey = (index: number, message: EventMessage) => message.id;

	const itemContent = React.useCallback(
		(index: number, message: EventMessage) => renderMessage(message),
		[renderMessage],
	);

	return (
		<Virtuoso
			computeItemKey={computeItemKey}
			data={messages}
			firstItemIndex={startIndex}
			ref={virtuoso}
			overscan={overscan}
			itemContent={itemContent}
			className='messages-list__items'
			itemsRendered={onMessagesRendered}
			onScroll={onScroll}
			onWheel={onWheel}
			components={{
				Header: function MessagesListSpinnerNext() {
					return (
						<Observer>
							{() => (
								<DirectionLoadingStatus
									direction={SearchDirection.Next}
									onKeepLoading={keepLoading}
									hearbeat={nextLoadHeartbeat}
									isLoading={isLoadingNextMessages || updateStore.isActive}
									noMatchingMesssages={noMatchingMessagesNext}
								/>
							)}
						</Observer>
					);
				},
				Footer: function MessagesListSpinnerPrevious() {
					return (
						<Observer>
							{() => (
								<DirectionLoadingStatus
									direction={SearchDirection.Previous}
									onKeepLoading={keepLoading}
									hearbeat={prevLoadHeartbeat}
									isLoading={isLoadingPreviousMessages}
									noMatchingMesssages={noMatchingMessagesPrev}
								/>
							)}
						</Observer>
					);
				},
			}}
		/>
	);
};

export default observer(MessagesVirtualizedList);

interface DirectionLoadingStatusProps {
	hearbeat: SSEHeartbeat | null;
	onKeepLoading: (searchDirection: SearchDirection.Next | SearchDirection.Previous) => void;
	noMatchingMesssages: boolean;
	isLoading: boolean;
	direction: SearchDirection.Next | SearchDirection.Previous;
}

function DirectionLoadingStatus(props: DirectionLoadingStatusProps) {
	const { noMatchingMesssages, onKeepLoading, hearbeat, isLoading, direction } = props;

	if (noMatchingMesssages) {
		return (
			<div className='messages-list__loading-message'>
				{hearbeat && (
					<span className='messages-list__loading-message-text'>
						No more matching messages {direction === SearchDirection.Next ? 'up to' : 'from'}&nbsp;
						{moment.utc(hearbeat.timestamp).format()}
					</span>
				)}
				<button className='messages-list__load-btn' onClick={() => onKeepLoading(direction)}>
					Keep loading
				</button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='messages-list__spinner-wrapper'>
				<div className='messages-list__spinner' />
				{hearbeat && (
					<div className='messages-list__search-info'>
						<span>Processed items: {hearbeat.scanCounter}</span>
						<span>Current search position: {formatTime(hearbeat.timestamp)}</span>
					</div>
				)}
			</div>
		);
	}

	return null;
}
