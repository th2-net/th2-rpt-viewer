/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
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
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { observer, Observer } from 'mobx-react-lite';
import moment from 'moment';
import { EventMessage, EventMessageItem } from '../../models/EventMessage';
import SplashScreen from '../SplashScreen';
import '../../styles/embedded.scss';
import api from '../../api';
import StateSaverProvider from '../util/StateSaverProvider';
import Empty from '../util/Empty';
import { useDebouncedCallback } from '../../hooks';
import { raf } from '../../helpers/raf';
import EmbeddedMessagesStore from './embedded-stores/EmbeddedMessagesStore';
import MessagesUpdateButton from '../message/MessagesUpdateButton';
import EmbeddedMessagesFilterPanel from './EmbeddedMessagesFilterPanel';
import MessageCard from '../message/message-card/MessageCard';

const messagesStore = new EmbeddedMessagesStore(api);

const EmbeddedMessages = () => {
	const { dataStore, scrolledIndex } = messagesStore;
	const { updateStore } = dataStore;

	const renderMsg = React.useCallback(
		(index: number, message: EventMessageItem) => <MessageCard message={message} />,
		[],
	);

	const reportURL = React.useMemo(() => {
		const messagesStoreState = {
			timestampFrom: messagesStore.filterStore.filter.timestampFrom,
			timestampTo: messagesStore.filterStore.filter.timestampTo,
			streams: messagesStore.filterStore.filter.streams,
			sse: messagesStore.filterStore.sseMessagesFilter,
			isSoftFilter: false,
		};

		const searchString = new URLSearchParams({
			workspaces: window.btoa(
				JSON.stringify([
					{
						messages: messagesStoreState,
					},
				]),
			),
		});

		return [window.location.origin, window.location.pathname, `?${searchString}`].join('');
	}, [messagesStore.filterStore.filter, messagesStore.filterStore.sseMessagesFilter]);

	if (dataStore.isError) {
		return (
			<Empty
				description='Error occured while loading messages'
				descriptionStyles={{ position: 'relative', bottom: '6px' }}
			/>
		);
	}

	return (
		<div className='messages-list'>
			<div className='messages-list__header'>
				<MessagesUpdateButton
					isShow={updateStore.canActivate}
					isLoading={updateStore.isActive}
					subscribeOnChanges={updateStore.subscribeOnChanges}
					stopSubscription={updateStore.stopSubscription}
				/>
				<EmbeddedMessagesFilterPanel messagesStore={messagesStore} />
				<a href={reportURL} target='_black' className='report-viewer-link'>
					Report viewer
				</a>
			</div>
			{dataStore.messages.length === 0 &&
			(dataStore.isLoadingNextMessages || dataStore.isLoadingPreviousMessages) ? (
				<SplashScreen />
			) : dataStore.messages.length === 0 &&
			  !(dataStore.isLoadingNextMessages || dataStore.isLoadingPreviousMessages) ? (
				<Empty
					description='No messages'
					descriptionStyles={{ position: 'relative', bottom: '6px' }}
				/>
			) : (
				<StateSaverProvider>
					<MessagesVirtualizedList
						className='messages-list__items'
						rowCount={dataStore.messages.length}
						scrolledIndex={scrolledIndex}
						itemRenderer={renderMsg}
						overscan={0}
						loadNextMessages={dataStore.getNextMessages}
						loadPrevMessages={dataStore.getPreviousMessages}
					/>
				</StateSaverProvider>
			)}
		</div>
	);
};

EmbeddedMessages.displayName = 'EmbeddedMessages';

const EmbeddedMessagesApp = observer(EmbeddedMessages);
export default function MessagesApp() {
	return <EmbeddedMessagesApp />;
}

interface Props {
	computeItemKey?: (idx: number) => React.Key;
	rowCount: number;
	itemRenderer: (index: number, message: EventMessageItem) => React.ReactElement;
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
	loadNextMessages: () => Promise<EventMessage[]>;
	loadPrevMessages: () => Promise<EventMessage[]>;
}

const MessagesVirtualizedList = observer((props: Props) => {
	const virtuoso = React.useRef<VirtuosoHandle>(null);

	const {
		className,
		overscan = 3,
		itemRenderer,
		loadPrevMessages,
		loadNextMessages,
		scrolledIndex,
	} = props;

	const [messageList, setMessageList] = React.useState<EventMessageItem[]>([]);

	React.useEffect(() => {
		messagesStore.dataStore.messages.forEach(message =>
			message.parsedMessages?.forEach((parsedMessage, index) => {
				const tempMessage = message;
				const { parsedMessages, ...rest } = tempMessage;
				const tempMessageItem: EventMessageItem = {
					...rest,
					parsedMessage: null,
					parsedMessages: [],
				};

				tempMessageItem.parsedMessage = tempMessage.parsedMessages
					? tempMessage.parsedMessages[index]
					: null;

				if (tempMessageItem.parsedMessages && tempMessageItem.parsedMessage)
					tempMessageItem.parsedMessages[0] = tempMessageItem.parsedMessage;

				setMessageList([...messageList, tempMessageItem]);
			}),
		);
	}, [messagesStore.dataStore.messages]);

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
					messagesStore.dataStore.searchChannelNext &&
					!messagesStore.dataStore.searchChannelNext.isLoading &&
					!messagesStore.dataStore.searchChannelNext.isEndReached &&
					!messagesStore.dataStore.updateStore.isActive &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'next')
				) {
					loadNextMessages().then(messages =>
						messagesStore.dataStore.onNextChannelResponse(messages),
					);
				}

				if (
					isEndReached &&
					messagesStore.dataStore.searchChannelPrev &&
					!messagesStore.dataStore.searchChannelPrev.isLoading &&
					!messagesStore.dataStore.searchChannelPrev.isEndReached &&
					(wheelScrollDirection === undefined || wheelScrollDirection === 'previous')
				) {
					loadPrevMessages().then(messages =>
						messagesStore.dataStore.onPrevChannelResponse(messages),
					);
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
			data={messageList}
			firstItemIndex={messagesStore.dataStore.startIndex}
			ref={virtuoso}
			overscan={overscan}
			itemContent={itemRenderer}
			style={{ height: '100%', width: '100%' }}
			className={className}
			onScroll={onScroll}
			onWheel={onWheel}
			components={{
				Header: function MessagesListSpinnerNext() {
					return (
						<Observer>
							{() =>
								messagesStore.dataStore.noMatchingMessagesNext ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment.utc(messagesStore.filterStore.filterParams.startTimestamp).format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesStore.dataStore.keepLoading('next')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner isLoading={messagesStore.dataStore.isLoadingNextMessages} />
								)
							}
						</Observer>
					);
				},
				Footer: function MessagesListSpinnerPrevious() {
					return (
						<Observer>
							{() =>
								messagesStore.dataStore.noMatchingMessagesPrev ? (
									<div className='messages-list__loading-message'>
										<span className='messages-list__loading-message-text'>
											No more matching messages since&nbsp;
											{moment(messagesStore.filterStore.filterParams.startTimestamp).utc().format()}
										</span>
										<button
											className='messages-list__load-btn'
											onClick={() => messagesStore.dataStore.keepLoading('previous')}>
											Keep loading
										</button>
									</div>
								) : (
									<MessagesListSpinner
										isLoading={messagesStore.dataStore.isLoadingPreviousMessages}
									/>
								)
							}
						</Observer>
					);
				},
			}}
		/>
	);
});

export { MessagesVirtualizedList };

interface SpinnerProps {
	isLoading: boolean;
}
const MessagesListSpinner = ({ isLoading }: SpinnerProps) => {
	if (!isLoading) return null;

	return <div className='messages-list__spinner' />;
};
