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
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import Empty from '../util/Empty';
import SplashScreen from '../SplashScreen';
import StateSaverProvider from '../util/StateSaverProvider';
import { usePrevious, useWorkspaceEventStore } from '../../hooks';
import { raf } from '../../helpers/raf';
import { EventTreeNode } from '../../models/EventAction';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import '../../styles/action.scss';

interface Props {
	nodes: EventTreeNode[];
	scrolledIndex: Number | null;
	selectedNode: EventTreeNode | null;
	renderEvent: (index: number, event: EventTreeNode) => React.ReactNode;
}

const START_INDEX = 100_000;

function EventTreeListBase(props: Props) {
	const { nodes, scrolledIndex, selectedNode, renderEvent } = props;

	const initialItemCount = React.useRef(nodes.length);
	const virtuosoRef = React.useRef<VirtuosoHandle | null>(null);
	const listRef = React.useRef<HTMLDivElement>(null);

	const [isFollowingSelectedNode, setIsFollowingSelectedNode] = React.useState(true);
	const [firstItemIndex, setFirstItemIndex] = React.useState(START_INDEX);
	const [eventNodes, setEventNodes] = React.useState<EventTreeNode[]>(nodes.slice());

	const prevNodes = usePrevious(nodes);

	React.useEffect(() => {
		let adjustedIndex = firstItemIndex;
		if (prevNodes && nodes.length > prevNodes?.length) {
			if (selectedNode) {
				const selectedNodeIndex = eventNodes.findIndex(
					node => node.eventId === selectedNode.eventId,
				);
				const newIndex = nodes.findIndex(node => node.eventId === selectedNode.eventId);

				if (selectedNodeIndex !== newIndex) {
					adjustedIndex = firstItemIndex - (newIndex - selectedNodeIndex);
				}
			}

			if (isFollowingSelectedNode) {
				setFirstItemIndex(adjustedIndex);
			}
		}

		if (prevNodes?.length !== nodes.length) {
			setEventNodes(nodes.slice());
		}
	}, [nodes, selectedNode, eventNodes, firstItemIndex]);

	React.useEffect(() => {
		if (!selectedNode) {
			setIsFollowingSelectedNode(false);
		}

		function handleClick() {
			setIsFollowingSelectedNode(() => false);
		}

		if (listRef.current && selectedNode) {
			listRef.current.addEventListener('click', handleClick);
			listRef.current.addEventListener('scroll', handleClick);
		}

		return () => {
			if (listRef.current) {
				listRef.current.removeEventListener('click', handleClick);
				listRef.current.removeEventListener('scroll', handleClick);
			}
		};
	}, [selectedNode]);

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

	const computeKey = (index: number) => eventNodes[index].eventId;

	return (
		<div className='actions-list' ref={listRef}>
			<StateSaverProvider>
				<Virtuoso
					firstItemIndex={firstItemIndex}
					initialTopMostItemIndex={initialItemCount.current - 1}
					data={eventNodes}
					ref={virtuosoRef}
					totalCount={eventNodes.length}
					computeItemKey={computeKey}
					overscan={3}
					itemContent={renderEvent}
					style={{ height: '100%' }}
				/>
			</StateSaverProvider>
		</div>
	);
}

const EventTreeList = React.memo(EventTreeListBase);

interface EventListWrapperProps {
	renderEvent: (index: number, event: EventTreeNode) => React.ReactNode;
	events: EventTreeNode[];
}

function EventTreeListWrapper(props: EventListWrapperProps) {
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
			nodes={props.events}
			scrolledIndex={eventsStore.scrolledIndex}
			selectedNode={eventsStore.selectedNode}
			renderEvent={props.renderEvent}
		/>
	);
}

export default observer(EventTreeListWrapper);
