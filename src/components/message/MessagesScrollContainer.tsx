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

import React from 'react';
import { Observer } from 'mobx-react-lite';
import { TScrollContainer } from 'react-virtuoso';
import Heatmap from '../heatmap/Heatmap';
import { useHeatmap } from '../../hooks/useHeatmap';
import { HeatmapElement } from '../../models/Heatmap';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import { InfiniteLoaderContext } from './MessagesVirtualizedList';
import { MessagesLoadingState } from '../../stores/MessagesStore';

const MessagesScrollContainer: TScrollContainer = ({
	className,
	style,
	reportScrollTop,
	scrollTo,
	children,
}) => {
	const scrollContainer = React.useRef<HTMLDivElement>(null);
	const { setVisibleRange } = useHeatmap();
	const messagesStore = useMessagesWindowStore();

	const [loadingPrevItems, setLoadingPrevItems] = React.useState(false);
	const [loadingNextItems, setLoadingNextItems] = React.useState(false);

	const {
		loadingState,
		onScrollBottom,
		onScrollTop,
		visibleItemsIndices,
	} = React.useContext(InfiniteLoaderContext);

	scrollTo((scrollTop: ScrollToOptions) => {
		scrollContainer.current?.scrollTo(scrollTop);
	});

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex' }}>
			<div style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				marginRight: '11px',
				flexGrow: 1,
			}}>
				{loadingState === MessagesLoadingState.LOADING_NEXT_ITEMS
					&& <div className="messages-list__spinner"/>}
				<div
					ref={scrollContainer}
					onScroll={(e: React.SyntheticEvent<HTMLDivElement>) => {
						reportScrollTop(e.currentTarget.scrollTop);
						setVisibleRange(visibleItemsIndices);
					}}
					onWheel={e => {
						if (
							!loadingNextItems
							&& visibleItemsIndices.startIndex < messagesStore.MESSAGES_CHUNK_SIZE
							&& !messagesStore.isBeginReached
						) {
							setLoadingNextItems(true);
							onScrollBottom().then(() => setLoadingNextItems(false));
						}

						if (
							!loadingPrevItems
							&& visibleItemsIndices.endIndex
							> messagesStore.messagesIds.length - messagesStore.MESSAGES_CHUNK_SIZE
							&& !messagesStore.isEndReached
						) {
							setLoadingPrevItems(true);
							onScrollTop().then(() => setLoadingPrevItems(false));
						}
					}}
					style={{
						...style,
						flexGrow: 1,
						position: 'relative',
					}}
					tabIndex={0}
					className={className}
				>
					{children}
				</div>
				{loadingState === MessagesLoadingState.LOADING_SELECTED_MESSAGE
					&& <div className="messages-list__overlay-loader">
						<div className="messages-list__overlay-spinner"/>
					</div>}
				{loadingState === MessagesLoadingState.LOADING_PREVIOUS_ITEMS
					&& <div className="messages-list__spinner"/>}
			</div>
			<Observer>
				{() => <Heatmap
					onElementClick={(element: HeatmapElement) => {
						if (element.id) {
							messagesStore.selectedMessageId = new String(element.id);
						}
					}}
					selectedItem={messagesStore.selectedMessageId?.valueOf() || null} />}
			</Observer>
		</div>
	);
};

export default MessagesScrollContainer;
