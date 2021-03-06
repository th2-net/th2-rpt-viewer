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
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import moment from 'moment';
import {
	useDebouncedCallback,
	useMessagesDataStore,
	useMessagesWorkspaceStore,
} from '../../../hooks';
import { EventMessage } from '../../../models/EventMessage';
import { raf } from '../../../helpers/raf';

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
	scrolledIndex: Number | null;
	className?: string;
	overscan?: number;
	loadNextMessages: (resumeFromId?: string) => Promise<EventMessage[]>;
	loadPrevMessages: (resumeFromId?: string) => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const {
		className,
		overscan = 3,
		itemRenderer,
		loadPrevMessages,
		loadNextMessages,
		scrolledIndex,
	} = props;

	React.useEffect(() => {
		if (scrolledIndex !== null) {
			raf(() => {
				virtuoso.current?.scrollToIndex({ index: scrolledIndex.valueOf(), align: 'center' });
			}, 3);
		}
	}, [scrolledIndex]);

	const debouncedScrollHandler = useDebouncedCallback(
		(event: React.UIEvent<'div'>, wheelScrollDirection?: 'next' | 'previous') => {
			const scroller = event.target;
			if (scroller instanceof Element) {
				const isStartReached = scroller.scrollTop === 0;
				const isEndReached = scroller.scrollHeight - scroller.scrollTop === scroller.clientHeight;
				if (
					isStartReached &&
					messagesDataStore.searchChannelNext &&
					!messagesDataStore.searchChannelNext.isLoading &&
					!messagesDataStore.searchChannelNext.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'next')
				) {
					loadNextMessages(messagesDataStore.messages[0]?.messageId).then(messages =>
						messageStore.dataStore.onNextChannelResponse(messages),
					);
				}

				if (
					isEndReached &&
					messagesDataStore.searchChannelPrev &&
					!messagesDataStore.searchChannelPrev.isLoading &&
					!messagesDataStore.searchChannelPrev.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'previous')
				) {
					loadPrevMessages(
						messagesDataStore.messages[messagesDataStore.messages.length - 1]?.messageId,
					).then(messages => messageStore.dataStore.onPrevChannelResponse(messages));
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

	return (
		<Virtuoso
			data={messagesDataStore.messages}
			firstItemIndex={messagesDataStore.startIndex}
			initialTopMostItemIndex={messagesDataStore.initialItemCount}
			ref={virtuoso}
			overscan={overscan}
			itemContent={itemRenderer}
			style={{ height: '100%', width: '100%' }}
			className={className}
			itemsRendered={messages => {
				messageStore.currentMessagesIndexesRange = {
					startIndex: (messages && messages[0]?.originalIndex) ?? 0,
					endIndex: (messages && messages[messages.length - 1]?.originalIndex) ?? 0,
				};
			}}
			onScroll={onScroll}
			onWheel={onWheel}
			components={{
				Header: function MessagesListSpinnerNext() {
					return (
						<Observer>
							{() =>
								messagesDataStore.noMatchingMessagesNext ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment.utc(messageStore.filterStore.filterParams.startTimestamp).format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesDataStore.keepLoading('next')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner isLoading={messagesDataStore.isLoadingNextMessages} />
								)
							}
						</Observer>
					);
				},
				Footer: function MessagesListSpinnerPrevious() {
					return (
						<Observer>
							{() =>
								messagesDataStore.noMatchingMessagesPrev ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment(messageStore.filterStore.filterParams.startTimestamp).utc().format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesDataStore.keepLoading('previous')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner isLoading={messagesDataStore.isLoadingPreviousMessages} />
								)
							}
						</Observer>
					);
				},
			}}
		/>
	);
};

export default observer(MessagesVirtualizedList);

interface SpinnerProps {
	isLoading: boolean;
}
const MessagesListSpinner = ({ isLoading }: SpinnerProps) => {
	if (!isLoading) return null;
	return <div className='messages-list__spinner' />;
};
