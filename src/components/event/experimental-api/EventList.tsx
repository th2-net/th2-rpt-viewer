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
import Empty from '../../util/Empty';
import SplashScreen from '../../SplashScreen';
import StateSaverProvider from '../../util/StateSaverProvider';
import { raf } from '../../../helpers/raf';
import { EventAction } from '../../../models/EventAction';
import EventTree from './EventTree';
import { useExperimentalApiEventStore } from './ExperimentalAPIEventStore';
import '../../../styles/action.scss';

interface Props {
	selectedNode: EventAction | null;
}

const START_INDEX = 100_000;

function EventTreeListBase(props: Props) {
	const { selectedNode } = props;

	const eventStore = useExperimentalApiEventStore();

	const nodes = eventStore.tree;

	const eventsInViewport = React.useRef<ListItem<string>[]>([]);

	const initialItemCount = React.useRef(nodes.length);
	const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);
	const listRef = React.useRef<HTMLDivElement>(null);

	const [firstItemIndex, setFirstItemIndex] = React.useState(START_INDEX);
	const [currentNodes, setCurrentNodes] = React.useState<string[]>(nodes.slice());

	const prevIsExpandedMap = React.useRef<Map<string, boolean>>(new Map());

	const renderEvent = React.useCallback(
		(index: number, id: string) => <EventTree eventId={id} />,
		[],
	);

	React.useEffect(() => {
		let isExpandedMapChanged = false;
		const expandedMapChanges: string[] = [];
		if (prevIsExpandedMap.current) {
			eventStore.isExpanded.forEach((value, key) => {
				if (value !== prevIsExpandedMap.current.get(key) || !prevIsExpandedMap.current.has(key)) {
					isExpandedMapChanged = true;
					expandedMapChanges.push(key);
				}
			});
			prevIsExpandedMap.current = new Map([...eventStore.isExpanded]);
		}
		let adjustedIndex = firstItemIndex;

		if (selectedNode && expandedMapChanges.some(([eventId]) => eventId === selectedNode.eventId)) {
			isExpandedMapChanged = false;
		}

		if (!isExpandedMapChanged && nodes.length > currentNodes.length) {
			let originalIndex = -1;
			let relativeEventId: string | null;
			if (
				selectedNode &&
				eventsInViewport.current.find(event => event?.data === selectedNode.eventId)
			) {
				relativeEventId = selectedNode.eventId;
				originalIndex = currentNodes.findIndex(eventId => eventId === selectedNode.eventId);
			} else {
				const firstListItem = eventsInViewport.current[0];
				relativeEventId = firstListItem?.data || null;
				originalIndex = firstListItem?.originalIndex || -1;
			}
			if (relativeEventId) {
				const newIndex = nodes.findIndex(eventId => eventId === relativeEventId);
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
				if (eventStore.scrolledIndex !== null) {
					virtuosoRef.current?.scrollToIndex({
						index: eventStore.scrolledIndex.valueOf(),
						align: 'center',
					});
				}
			}, 3);
		} catch (e) {
			console.error(e);
		}
	}, [eventStore.scrolledIndex]);

	const computeItemKey = React.useCallback((index: number, eventId: string) => eventId, []);

	return (
		<div className='actions-list' ref={listRef}>
			<StateSaverProvider>
				<Virtuoso
					computeItemKey={computeItemKey}
					firstItemIndex={firstItemIndex}
					initialTopMostItemIndex={initialItemCount.current - 1}
					data={currentNodes}
					ref={virtuosoRef}
					totalCount={currentNodes.length}
					overscan={3}
					itemContent={renderEvent}
					style={{ height: '100%' }}
					itemsRendered={events => {
						eventsInViewport.current = events;
					}}
				/>
			</StateSaverProvider>
		</div>
	);
}

const EventTreeList = observer(EventTreeListBase);

function EventTreeListWrapper() {
	const store = useExperimentalApiEventStore();

	if (store.rootIds.length === 0) {
		if (store.isLoadingRootIds) {
			return <SplashScreen />;
		}
		if (!store.isLoadingRootIds) {
			return <Empty description='No events' />;
		}
		return (
			<Empty
				description='Error occured while loading events'
				descriptionStyles={{ position: 'relative', bottom: '19px' }}
			/>
		);
	}

	return <EventTreeList selectedNode={store.selectedEvent} />;
}

export default observer(EventTreeListWrapper);
