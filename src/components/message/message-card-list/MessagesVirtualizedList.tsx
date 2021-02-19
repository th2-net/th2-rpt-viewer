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
import { Virtuoso, VirtuosoMethods, TScrollContainer } from 'react-virtuoso';
import { useMessagesDataStore, useMessagesWorkspaceStore } from '../../../hooks';
import { EventMessage } from '../../../models/EventMessage';
import { raf } from '../../../helpers/raf';

interface Props {
	computeItemKey?: (idx: number) => React.Key;
	rowCount: number;
	itemRenderer: (index: number) => React.ReactElement;
	/*
		Number objects is used here because in some cases (eg one message / action was 
		selected several times by different entities)
		We can't understand that we need to scroll to the selected entity again when
		we are comparing primitive numbers.
		Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
	scrolledIndex: Number | null;
	className?: string;
	ScrollContainer?: TScrollContainer;
	overscan?: number;
	loadNextMessages: () => Promise<EventMessage[]>;
	loadPrevMessages: () => Promise<EventMessage[]>;
	isLoadingNextMessages: boolean;
	isLoadingPreviousMessages: boolean;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const virtuoso = React.useRef<VirtuosoMethods>(null);

	const {
		rowCount,
		computeItemKey,
		className,
		ScrollContainer,
		overscan = 3,
		itemRenderer,
		loadPrevMessages,
		loadNextMessages,
		isLoadingNextMessages,
		isLoadingPreviousMessages,
		scrolledIndex,
	} = props;

	React.useEffect(() => {
		async function fetchStartMessages() {
			const messages = await startReached();
			messagesDataStore.isEndReached =
				messages.length === 0 && !messagesDataStore.searchChannelNext?.isLoading;
		}

		async function fetchEndMessages() {
			const messages = await endReached();
			messagesDataStore.isEndReached =
				messages.length === 0 && !messagesDataStore.searchChannelPrev?.isLoading;
		}
		if (messagesDataStore.messages.length < 12) {
			if (!messagesDataStore.isEndReached) {
				fetchEndMessages();
			}

			if (!messagesDataStore.isBeginReached) {
				fetchStartMessages();
			}
		}
	}, [
		rowCount,
		messagesDataStore.messages,
		messagesDataStore.isBeginReached,
		messagesDataStore.isEndReached,
	]);

	React.useEffect(() => {
		if (scrolledIndex !== null) {
			raf(() => {
				virtuoso.current?.scrollToIndex({ index: scrolledIndex.valueOf(), align: 'center' });
			}, 3);
		}
	}, [scrolledIndex]);

	const startReached = () => {
		return loadNextMessages().then(messages => {
			if (messages.length > 0) {
				messageStore.data.onNextChannelResponse(messages);
				setTimeout(() => {
					virtuoso.current?.adjustForPrependedItems(messages.length - 1);
				}, 50);
			}
			return messages;
		});
	};

	const endReached = () => {
		return loadPrevMessages().then(messages => {
			if (messages.length > 0) {
				messageStore.data.onPrevChannelResponse(messages);
			}
			return messages;
		});
	};

	return (
		<InfiniteLoaderContext.Provider
			value={{
				startReached,
				endReached,
				isLoadingNextMessages,
				isLoadingPreviousMessages,
			}}>
			<Virtuoso
				totalCount={rowCount}
				ref={virtuoso}
				overscan={overscan}
				computeItemKey={computeItemKey}
				item={itemRenderer}
				style={{ height: '100%', width: '100%' }}
				className={className}
				ScrollContainer={ScrollContainer}
				rangeChanged={range => {
					messageStore.currentMessagesIndexesRange = range;
				}}
			/>
		</InfiniteLoaderContext.Provider>
	);
};

interface InfiniteScrollContextValue {
	startReached: () => Promise<EventMessage[]>;
	endReached: () => Promise<EventMessage[]>;
	isLoadingNextMessages: boolean;
	isLoadingPreviousMessages: boolean;
}

export const InfiniteLoaderContext = React.createContext<InfiniteScrollContextValue>(
	{} as InfiniteScrollContextValue,
);

export default observer(MessagesVirtualizedList);
