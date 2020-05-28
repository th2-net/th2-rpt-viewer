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
import ResizeObserver from 'resize-observer-polyfill';
import StateSaverProvider from '../util/StateSaverProvider';
import { VirtualizedList } from '../VirtualizedList';
import { createBemElement } from '../../helpers/styleCreators';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import SkeletonedMessageCardListItem from './SkeletonedMessageCardListItem';
import Empty from '../Empty';
import SplashScreen from '../SplashScreen';
import MessagesScrollContainer from './MessagesScrollContainer';
import '../../styles/messages.scss';

export type MessagesHeights = { [index: number]: number };

const MessageCardList = () => {
	const { messagesStore, filterStore } = useEventWindowStore();
	const [messagesHeightsMap, setMessagesHeightMap] = React.useState<State>({});

	const resizeObserver = React.useRef(new ResizeObserver(entries => {
		const stateUpdate: MessagesHeights = {};
		entries.forEach(entry => {
			const { index } = (entry.target as HTMLDivElement).dataset;
			const { height } = entry.contentRect;
			if (index !== undefined
				&& messagesHeightsMap[parseInt(index)] !== height) {
				stateUpdate[parseInt(index)] = height;
			}
		});
		if (Object.entries(stateUpdate).length > 0) {
			setMessagesHeightMap((heights: MessagesHeights) => ({
				...heights,
				...stateUpdate,
			}));
		}
	}));

	const renderMessage = (index: number) => {
		const id = messagesStore.messagesIds[index];

		return (
			<MessageWrapper
				index={index}
				onMount={ref => resizeObserver.current.observe(ref.current as HTMLDivElement)}
				onUnmount={ref => resizeObserver.current.unobserve(ref.current as HTMLDivElement)}>
				<SkeletonedMessageCardListItem id={id}/>
			</MessageWrapper>
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
				<MessagesHeightsContext.Provider value={messagesHeightsMap}>
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
				</MessagesHeightsContext.Provider>
			</div>
		</div>
	);
};

export default observer(MessageCardList, { forwardRef: true });

type WrapperProps = React.PropsWithChildren<{
	onMount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
	onUnmount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
	index: number;
}>;

function MessageWrapper({
	index,
	onMount,
	onUnmount,
	children,
}: WrapperProps) {
	const ref = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		onMount(ref);

		return () => onUnmount(ref);
	}, []);

	return (
		<div ref={ref} data-index={index}>
			{children}
		</div>
	);
}

export const MessagesHeightsContext = React.createContext<MessagesHeights>({});
