/** *****************************************************************************
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
import { ListItem, Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Empty from '../util/Empty';
import SplashScreen from '../SplashScreen';
import StateSaverProvider from '../util/StateSaverProvider';
import { useWorkspaceEventStore } from '../../hooks';
import { raf } from '../../helpers/raf';
import { EventTreeNode } from '../../models/EventAction';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import '../../styles/action.scss';
import EventTree from './tree/EventTree';
import FlatEventListItem from './flat-event-list/FlatEventListItem';

interface Props {
	scrolledIndex: Number | null;
	selectedNode: EventTreeNode | null;
	isFlat?: boolean;
}

const START_INDEX = 100_000;

const virtuosoStyles: React.CSSProperties = { height: '100%' };

function EventTreeListBase(props: Props) {
	const eventStore = useWorkspaceEventStore();
	const { scrolledIndex, selectedNode, isFlat = false } = props;

	const nodes = !isFlat ? eventStore.nodesList : eventStore.flattenedEventList;

	const eventsInViewport = React.useRef<ListItem<EventTreeNode>[]>([]);

	const initialItemCount = React.useRef(nodes.length);
	const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);
	const listRef = React.useRef<HTMLDivElement>(null);

	const [firstItemIndex, setFirstItemIndex] = React.useState(START_INDEX);
	const [currentNodes, setCurrentNodes] = React.useState<EventTreeNode[]>(nodes.slice());

	const prevIsExpandedMap = React.useRef<Map<string, boolean>>(new Map());

	const renderEvent = React.useCallback(
		(_index: number, node: EventTreeNode) => {
			if (isFlat) {
				return <FlatEventListItem node={node} />;
			}

			return <EventTree eventTreeNode={node} />;
		},
		[isFlat],
	);

	React.useEffect(() => {
		let isExpandedMapChanged = false;
		const expandedMapChanges: string[] = [];
		if (prevIsExpandedMap.current) {
			eventStore.isExpandedMap.forEach((value, key) => {
				if (value !== prevIsExpandedMap.current.get(key) || !prevIsExpandedMap.current.has(key)) {
					isExpandedMapChanged = true;
					expandedMapChanges.push(key);
				}
			});
			prevIsExpandedMap.current = new Map([...eventStore.isExpandedMap]);
		}
		let adjustedIndex = firstItemIndex;

		if (selectedNode && expandedMapChanges.some(([eventId]) => eventId === selectedNode.eventId)) {
			isExpandedMapChanged = false;
		}

		if (!isExpandedMapChanged && nodes.length > currentNodes.length) {
			let originalIndex = -1;
			let relativeEvent: EventTreeNode | null;
			if (
				selectedNode &&
				eventsInViewport.current.find(event => event?.data?.eventId === selectedNode.eventId)
			) {
				relativeEvent = selectedNode;
				originalIndex = currentNodes.findIndex(event => event.eventId === selectedNode.eventId);
			} else {
				const firstListItem = eventsInViewport.current[0];
				relativeEvent = firstListItem?.data || null;
				originalIndex = firstListItem?.originalIndex || -1;
			}
			if (relativeEvent) {
				const newIndex = nodes.findIndex(node => node.eventId === relativeEvent!.eventId);
				if (originalIndex !== -1 && newIndex !== -1 && originalIndex !== newIndex) {
					adjustedIndex = firstItemIndex - (newIndex - originalIndex);
				}
			}

			setFirstItemIndex(adjustedIndex);
		}

		if (currentNodes.length !== nodes.length) {
			setCurrentNodes(nodes.slice());
		}
	}, [nodes, selectedNode, currentNodes, firstItemIndex]);

	React.useEffect(() => {
		try {
			raf(() => {
				if (scrolledIndex !== null) {
					virtuosoRef.current?.scrollToIndex({
						index: scrolledIndex.valueOf(),
						align: 'center',
					});
				}
			}, 3);
		} catch (e) {
			console.error(e);
		}
	}, [scrolledIndex]);

	const computeKey = React.useCallback((index: number, event: EventTreeNode) => event.eventId, []);

	const onItemsRendered = React.useCallback((listItems: ListItem<EventTreeNode>[]) => {
		eventsInViewport.current = listItems;
	}, []);

	return (
		<div className='actions-list' ref={listRef}>
			<StateSaverProvider>
				<Virtuoso
					firstItemIndex={firstItemIndex}
					initialTopMostItemIndex={initialItemCount.current - 1}
					data={currentNodes}
					ref={virtuosoRef}
					totalCount={currentNodes.length}
					computeItemKey={computeKey}
					overscan={3}
					itemContent={renderEvent}
					style={virtuosoStyles}
					itemsRendered={onItemsRendered}
				/>
			</StateSaverProvider>
		</div>
	);
}

const EventTreeList = observer(EventTreeListBase);

EventTreeList.displayName = 'EventTreeList';

interface EventTreeListWrapperProps {
	isFlat?: boolean;
}

function EventTreeListWrapper(props: EventTreeListWrapperProps) {
	const eventsStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();

	if (eventDataStore.rootEventIds.length === 0) {
		if (eventDataStore.isLoading) {
			return <SplashScreen />;
		}
		if (!eventDataStore.isLoading && !eventDataStore.isError) {
			return <Empty description='No events' />;
		}
		return (
			<Empty
				description='Error occured while loading events'
				descriptionStyles={{ position: 'relative', bottom: '19px' }}
			/>
		);
	}

	return (
		<EventTreeList
			scrolledIndex={eventsStore.scrolledIndex}
			selectedNode={eventsStore.selectedNode}
			isFlat={props.isFlat}
		/>
	);
}

export default observer(EventTreeListWrapper);
