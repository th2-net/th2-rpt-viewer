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
import {
	useDebouncedCallback,
	useMessagesDataStore,
	useMessagesWorkspaceStore,
} from '../../../hooks';
import { EventMessage } from '../../../models/EventMessage';
import { raf } from '../../../helpers/raf';
import { SSEHeartbeat } from '../../../api/sse';
import { formatTime } from '../../../helpers/date';

interface Props {
	computeItemKey?: (idx: number) => React.Key;
	rowCount: number;
	itemRenderer: (index: number, message: EventMessage) => React.ReactElement;
	/*
		 Number objects is used here because in some cases (eg one message / action was
		 selected several times by different entities)
		 We can't understand that we need to scroll to the selected entity again when
		 we are comparing primitive numbers.
		 Objects and reference comparison is the only way to handle numbers changing in this case.
	 */
	className?: string;
	overscan?: number;
	loadNextMessages: () => Promise<EventMessage[]>;
	loadPrevMessages: () => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesWorkspaceStore();
	const {
		sortedMessages: messageList,
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

	const { className, overscan = 3, itemRenderer, loadPrevMessages, loadNextMessages } = props;

	const [[firstPrevChunkIsLoaded, firstNextChunkIsLoaded], setLoadedChunks] = React.useState<
		[boolean, boolean]
	>([false, false]);

	const scrollToTop = () => {
		if (updateStore.isActive && virtuoso.current) virtuoso.current.scrollToIndex(0);
	};

	React.useEffect(() => {
		scrollToTop();
		raf(scrollToTop, 3);
	}, [updateStore.isActive, messageList]);

	React.useEffect(() => {
		if (!searchChannelNext?.isLoading) setLoadedChunks(loadedChunks => [true, loadedChunks[1]]);
		if (!searchChannelPrev?.isLoading) setLoadedChunks(loadedChunks => [loadedChunks[0], true]);
	}, [searchChannelNext?.isLoading, searchChannelPrev?.isLoading]);

	React.useEffect(() => {
		const selectedMessageId = messageStore.selectedMessageId?.valueOf();
		if (selectedMessageId) {
			raf(() => {
				const index = messageStore.dataStore.sortedMessages.findIndex(
					m => m.messageId === selectedMessageId,
				);
				if (index !== -1) virtuoso.current?.scrollToIndex({ index, align: 'center' });
			}, 3);
		}
	}, [
		messageStore.selectedMessageId,
		messageStore,
		firstPrevChunkIsLoaded,
		firstNextChunkIsLoaded,
	]);

	const debouncedScrollHandler = useDebouncedCallback((event: React.UIEvent<'div'>) => {
		const scroller = event.target;
		if (scroller instanceof Element) {
			const isStartReached = scroller.scrollTop === 0;
			if (
				isStartReached &&
				searchChannelNext &&
				!searchChannelNext.isLoading &&
				!updateStore.isActive
			) {
				loadNextMessages().then(messages => onNextChannelResponse(messages));
			}
		}
	}, 100);

	const onEndReached = () => {
		if (searchChannelPrev && !searchChannelPrev.isLoading && !searchChannelPrev.isEndReached) {
			loadPrevMessages().then(messages => onPrevChannelResponse(messages));
		}
	};

	const onWheel = (event: React.WheelEvent<'div'>) => {
		event.persist();
		if (event.deltaY < 0) debouncedScrollHandler(event);
	};

	const onScroll = (event: React.UIEvent<'div'>) => {
		event.persist();
		debouncedScrollHandler(event);
	};

	const onMessagesRendered = useDebouncedCallback((renderedMessages: ListItem<EventMessage>[]) => {
		messageStore.currentMessagesIndexesRange = {
			startIndex: (renderedMessages && renderedMessages[0]?.originalIndex) ?? 0,
			endIndex:
				(renderedMessages && renderedMessages[renderedMessages.length - 1]?.originalIndex) ?? 0,
		};
	}, 100);

	const computeItemKey = React.useCallback((index: number, msg: EventMessage) => msg.messageId, []);

	return (
		<Virtuoso
			data={messageList}
			firstItemIndex={startIndex}
			atBottomStateChange={onEndReached}
			ref={virtuoso}
			overscan={overscan}
			itemContent={itemRenderer}
			style={{ height: '100%', width: '100%' }}
			className={className}
			itemsRendered={onMessagesRendered}
			onScroll={onScroll}
			onWheel={onWheel}
			endReached={onEndReached}
			components={{
				Header: function MessagesListSpinnerNext() {
					return (
						<Observer>
							{() =>
								noMatchingMessagesNext ? (
									<div className='messages-list__loading-message'>
										{nextLoadHeartbeat && (
											<span className='messages-list__loading-message-text'>
												No more matching messages up to&nbsp;
												{moment.utc(nextLoadHeartbeat.timestamp).format()}
											</span>
										)}
										<button className='messages-list__load-btn' onClick={() => keepLoading('next')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner
										isLoading={isLoadingNextMessages || updateStore.isActive}
										searchInfo={nextLoadHeartbeat}
									/>
								)
							}
						</Observer>
					);
				},
				Footer: function MessagesListSpinnerPrevious() {
					return (
						<Observer>
							{() =>
								noMatchingMessagesPrev ? (
									<div className='messages-list__loading-message'>
										{prevLoadHeartbeat && (
											<span className='messages-list__loading-message-text'>
												No more matching messages from&nbsp;
												{moment.utc(prevLoadHeartbeat.timestamp).format()}
											</span>
										)}
										<button
											className='messages-list__load-btn'
											onClick={() => keepLoading('previous')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner
										isLoading={isLoadingPreviousMessages}
										searchInfo={prevLoadHeartbeat}
									/>
								)
							}
						</Observer>
					);
				},
			}}
			computeItemKey={computeItemKey}
		/>
	);
};

export default observer(MessagesVirtualizedList);

interface SpinnerProps {
	isLoading: boolean;
	searchInfo: SSEHeartbeat | null;
}
const MessagesListSpinner = ({ isLoading, searchInfo }: SpinnerProps) => {
	if (!isLoading) return null;
	return (
		<div className='messages-list__spinner-wrapper'>
			<div className='messages-list__spinner' />
			{searchInfo && (
				<div className='messages-list__search-info'>
					<span>Processed items: {searchInfo.scanCounter}</span>
					<span>Current search position: {formatTime(searchInfo.timestamp)}</span>
				</div>
			)}
		</div>
	);
};
