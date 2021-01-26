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
import { Virtuoso, VirtuosoMethods, TScrollContainer } from 'react-virtuoso';
import { defaultMessagesLoadingState } from '../../stores/messages/MessagesStore';
import { useAsyncEffect, useMessagesWorkspaceStore } from '../../hooks';
import { raf } from '../../helpers/raf';

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
	loadNextMessages: () => Promise<string[] | undefined>;
	loadPrevMessages: () => Promise<string[] | undefined>;
	loadingState: typeof defaultMessagesLoadingState;
}

const MessagesVirtualizedList = (props: Props) => {
	const messageStore = useMessagesWorkspaceStore();

	const virtuoso = React.useRef<VirtuosoMethods>(null);

	const {
		rowCount,
		computeItemKey,
		className,
		ScrollContainer,
		overscan = 3,
		scrolledIndex,
		itemRenderer,
		loadPrevMessages,
		loadNextMessages,
		loadingState,
	} = props;

	useAsyncEffect(async () => {
		if (scrolledIndex === null) return;
		let resultIndex = scrolledIndex.valueOf();

		if (scrolledIndex.valueOf() + 1 === rowCount) {
			await loadPrevMessages();
		}

		if (scrolledIndex.valueOf() === 0) {
			const nextMsg = await loadNextMessages();
			if (nextMsg != null) {
				virtuoso.current?.adjustForPrependedItems(nextMsg?.length);
				resultIndex += nextMsg.length;
			}
		}

		// we need raf callback here to wait prepended item render
		raf(() => {
			virtuoso.current?.scrollToIndex({ index: resultIndex, align: 'start' });
		}, 3);
	}, [scrolledIndex]);

	const onScrollBottom = () =>
		loadNextMessages().then(messagesIds => {
			if (messagesIds !== undefined) {
				virtuoso.current?.adjustForPrependedItems(messagesIds.length);
			}
			return messagesIds;
		});

	const onScrollTop = () => loadPrevMessages();

	return (
		<InfiniteLoaderContext.Provider
			value={{
				onScrollBottom,
				onScrollTop,
				loadingState,
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
					messageStore.setScrollTopMessageId(range.startIndex);
				}}
			/>
		</InfiniteLoaderContext.Provider>
	);
};

interface InfiniteScrollContextValue {
	onScrollBottom: () => Promise<string[] | undefined>;
	onScrollTop: () => Promise<string[] | undefined>;
	loadingState: typeof defaultMessagesLoadingState;
}

export const InfiniteLoaderContext = React.createContext<InfiniteScrollContextValue>(
	{} as InfiniteScrollContextValue,
);

export default MessagesVirtualizedList;
