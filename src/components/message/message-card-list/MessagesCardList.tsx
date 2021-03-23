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
import ResizeObserver from 'resize-observer-polyfill';
import SplashScreen from 'components/SplashScreen';
import Empty from 'components/util/Empty';
import { useMessagesDataStore, useMessagesWorkspaceStore } from 'hooks';
import { EventMessage } from 'models/EventMessage';
import MessageCard from '../message-card/MessageCard';
import MessagesVirtualizedList from './MessagesVirtualizedList';
import StateSaverProvider from '../../util/StateSaverProvider';
import 'styles/messages.scss';

export type MessagesHeights = { [index: number]: number };

function MessageCardList() {
	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const [messagesHeightsMap, setMessagesHeightMap] = React.useState<MessagesHeights>({});

	const resizeObserver = React.useRef(
		new ResizeObserver((entries: ResizeObserverEntry[]) => {
			const stateUpdate: MessagesHeights = {};
			entries.forEach(entry => {
				const { index } = (entry.target as HTMLDivElement).dataset;
				const { height } = entry.contentRect;
				if (index !== undefined && messagesHeightsMap[parseInt(index)] !== height) {
					stateUpdate[parseInt(index)] = height;
				}
			});
			if (Object.entries(stateUpdate).length > 0) {
				setMessagesHeightMap((heights: MessagesHeights) => ({
					...heights,
					...stateUpdate,
				}));
			}
		}),
	);

	const renderMsg = (index: number, message: EventMessage) => (
		<MessageWrapper
			index={index}
			onMount={ref => resizeObserver.current.observe(ref.current as HTMLDivElement)}
			onUnmount={ref => {
				if (ref.current) {
					resizeObserver.current.unobserve(ref.current as HTMLDivElement);
				}
			}}>
			<MessageCard message={message} />
		</MessageWrapper>
	);

	if (
		messagesDataStore.messages.length === 0 &&
		(messagesDataStore.isLoadingNextMessages || messagesDataStore.isLoadingPreviousMessages)
	) {
		return <SplashScreen />;
	}

	if (messagesDataStore.isError) {
		return (
			<Empty
				description='Error occured while loading messages'
				descriptionStyles={{ position: 'relative', bottom: '6px' }}
			/>
		);
	}

	if (
		!(messagesDataStore.isLoadingNextMessages || messagesDataStore.isLoadingPreviousMessages) &&
		messagesDataStore.messages.length === 0
	) {
		if (messagesDataStore.isError === false) {
			return (
				<Empty
					description='No messages'
					descriptionStyles={{ position: 'relative', bottom: '6px' }}
				/>
			);
		}
	}

	return (
		<div className='messages-list'>
			<MessagesHeightsContext.Provider value={messagesHeightsMap}>
				<StateSaverProvider>
					<MessagesVirtualizedList
						className='messages-list__items'
						rowCount={messagesDataStore.messages.length}
						scrolledIndex={messagesStore.scrolledIndex}
						itemRenderer={renderMsg}
						overscan={0}
						loadNextMessages={messagesDataStore.getNextMessages}
						loadPrevMessages={messagesDataStore.getPreviousMessages}
					/>
				</StateSaverProvider>
			</MessagesHeightsContext.Provider>
		</div>
	);
}

export default observer(MessageCardList, { forwardRef: true });

type WrapperProps = React.PropsWithChildren<{
	onMount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
	onUnmount: (ref: React.MutableRefObject<HTMLDivElement | null>) => void;
	index: number;
}>;

function MessageWrapper({ index, onMount, onUnmount, children }: WrapperProps) {
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
