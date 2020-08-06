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

import * as React from 'react';
import { Virtuoso, VirtuosoMethods, TScrollContainer } from 'react-virtuoso';
import { ListRange } from 'react-virtuoso/dist/engines/scrollSeekEngine';
import { MessagesLoadingState } from '../../stores/MessagesStore';

interface Props {
    computeItemKey?: (idx: number) => React.Key;
	rowCount: number;
	itemRenderer: (index: number) => React.ReactElement;
	/*
		Number objects is used here because in some cases (eg one message / action was selected several times
		by different entities)
		We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
		Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
    // eslint-disable-next-line @typescript-eslint/ban-types
	scrolledIndex: Number | null;
	className?: string;
	ScrollContainer?: TScrollContainer;
	overscan?: number;
	loadNextMessages: () => Promise<string[] | undefined>;
	loadPrevMessages: () => Promise<string[] | undefined>;
	loadingState: MessagesLoadingState | null;
}

const MessagesVirtualizedList = (props: Props) => {
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

	const [visibleItemsIndices, setvisibleItemsIndices] = React.useState<ListRange>({
		startIndex: 0,
		endIndex: 0,
	});

	React.useEffect(() => {
		if (scrolledIndex !== null) {
			virtuoso.current?.scrollToIndex({ index: +scrolledIndex, align: 'start' });
		}
	}, [scrolledIndex]);

	const onScrollBottom = () => loadNextMessages()
		.then(messagesIds => {
			if (messagesIds !== undefined) {
				virtuoso.current?.adjustForPrependedItems(messagesIds.length);
			}
			return messagesIds;
		});

	const onScrollTop = () => loadPrevMessages();

	return (
		<InfiniteLoaderContext.Provider value={{
			onScrollBottom,
			onScrollTop,
			loadingState,
			visibleItemsIndices,
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
				rangeChanged={({ startIndex, endIndex }) => setvisibleItemsIndices({ startIndex, endIndex })} />
		</InfiniteLoaderContext.Provider>
	);
};

interface InfiniteScrollContextValue {
	onScrollBottom: () => Promise<string[] | undefined>;
	onScrollTop: () => Promise<string[] | undefined>;
	loadingState: MessagesLoadingState | null;
	visibleItemsIndices: ListRange;
}

export const InfiniteLoaderContext = React.createContext<InfiniteScrollContextValue>({} as InfiniteScrollContextValue);

export default MessagesVirtualizedList;
