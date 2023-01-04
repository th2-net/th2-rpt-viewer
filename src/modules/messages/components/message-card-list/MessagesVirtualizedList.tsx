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
import { isEventMessage } from 'helpers/message';
import { SearchDirection } from 'models/SearchDirection';
import { EventMessage } from 'models/EventMessage';
import { useDebouncedCallback } from 'hooks/index';
import { raf } from 'helpers/raf';
import { SSEHeartbeat } from 'api/sse';
import { formatTime } from 'helpers/date';
import useElementSize from 'hooks/useElementSize';
import { Button } from 'components/buttons/Button';
import { Paper } from 'components/Paper';
import { Progress } from 'components/Progress';
import CardDisplayType, { COLLAPSED_MESSAGES_WIDTH } from 'models/util/CardDisplayType';
import { useMessagesDataStore } from '../../hooks/useMessagesDataStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';

interface Props {
	renderMessage: (message: EventMessage, displayType: CardDisplayType) => React.ReactElement;
	overscan?: number;
	loadNextMessages: () => Promise<EventMessage[]>;
	loadPrevMessages: () => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesStore();
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
	const scrollerRef = React.useRef<HTMLDivElement | null>(null);

	const { overscan = 3, renderMessage, loadPrevMessages, loadNextMessages } = props;

	const [[firstPrevChunkIsLoaded, firstNextChunkIsLoaded], setLoadedChunks] = React.useState<
		[boolean, boolean]
	>([false, false]);

	const messagesListWidth = useElementSize(scrollerRef.current)?.width;

	const displayType = React.useMemo(
		() =>
			messagesListWidth && messagesListWidth < COLLAPSED_MESSAGES_WIDTH
				? CardDisplayType.MINIMAL
				: CardDisplayType.FULL,
		[messagesListWidth],
	);
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
					m => m.id === selectedMessageId,
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
				loadNextMessages().then(onNextChannelResponse);
			}
		}
	}, 100);

	const onEndReached = () => {
		if (searchChannelPrev && !searchChannelPrev.isLoading && !searchChannelPrev.isEndReached) {
			loadPrevMessages().then(onPrevChannelResponse);
		}
	};

	const onScroll = (event: React.UIEvent<'div'>) => {
		event.persist();
		debouncedScrollHandler(event);
	};

	const onMessagesRendered = useDebouncedCallback((renderedMessages: ListItem<EventMessage>[]) => {
		messageStore.setRenderedItems(
			renderedMessages.map(listItem => listItem.data).filter(isEventMessage),
		);
	}, 800);

	const itemContent = React.useCallback(
		(index: number, message: EventMessage) => renderMessage(message, displayType),
		[renderMessage, displayType],
	);

	const handleScrollerRef = React.useCallback(ref => {
		scrollerRef.current = ref;
	}, []);

	const computeItemKey = React.useCallback((index: number, msg: EventMessage) => msg.id, []);

	return (
		<Virtuoso
			data={messageList}
			firstItemIndex={startIndex}
			atBottomStateChange={onEndReached}
			ref={virtuoso}
			scrollerRef={handleScrollerRef}
			overscan={overscan}
			itemContent={itemContent}
			className='messages-list__items'
			itemsRendered={onMessagesRendered}
			onScroll={onScroll}
			endReached={onEndReached}
			computeItemKey={computeItemKey}
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
			<div className='messages-list__loading-status'>
				<Paper style={{ backgroundColor: hearbeat ? undefined : 'transparent' }}>
					{hearbeat && (
						<span className='messages-list__no-matching-text'>
							No more matching messages {direction === SearchDirection.Next ? 'up to' : 'from'}
							&nbsp;
							{moment.utc(hearbeat.timestamp).format()}
						</span>
					)}
					<Button variant='rounded' onClick={() => onKeepLoading(direction)}>
						Keep loading
					</Button>
				</Paper>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='messages-list__loading-status'>
				<Paper style={{ backgroundColor: hearbeat ? undefined : 'transparent' }}>
					<Progress size={24} />
					{hearbeat && (
						<div className='messages-list__search-info'>
							<span>Processed items: {hearbeat.scanCounter}</span>
							<span>Current search position: {formatTime(hearbeat.timestamp)}</span>
						</div>
					)}
				</Paper>
			</div>
		);
	}

	return null;
}
