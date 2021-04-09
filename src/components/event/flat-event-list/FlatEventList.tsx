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
import { observer, Observer } from 'mobx-react-lite';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import EventCardHeader from '../EventCardHeader';
import Empty from '../../util/Empty';
import SplashScreen from '../../SplashScreen';
import StateSaverProvider from '../../util/StateSaverProvider';
import { useWorkspaceEventStore } from '../../../hooks';
import { raf } from '../../../helpers/raf';
import CardDisplayType from '../../../util/CardDisplayType';
import { EventTreeNode } from '../../../models/EventAction';
import { EventListFooter, EventListHeader } from '../EventListNavigation';
import useEventsDataStore from '../../../hooks/useEventsDataStore';
import '../../../styles/action.scss';

interface Props {
	nodes: EventTreeNode[];
}

function FlatEventList({ nodes }: Props) {
	const eventsStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();

	const listRef = React.useRef<VirtuosoHandle | null>(null);

	React.useEffect(() => {
		try {
			raf(() => {
				if (eventsStore.scrolledIndex !== null) {
					listRef.current?.scrollToIndex({
						index: eventsStore.scrolledIndex.valueOf(),
						align: 'center',
					});
				}
			}, 3);
		} catch (e) {
			console.error(e);
		}
	}, [eventsStore.scrolledIndex, eventsStore.viewStore.flattenedListView]);

	const computeKey = (index: number) => nodes[index].eventId;

	const renderEvent = (index: number): React.ReactElement => {
		const node = nodes[index];

		return (
			<Observer>
				{() => (
					<div style={{ padding: '1px 5px' }}>
						<EventCardHeader
							childrenCount={0}
							event={node}
							displayType={CardDisplayType.MINIMAL}
							onSelect={() => eventsStore.selectNode(node)}
							isSelected={eventsStore.isNodeSelected(node)}
							isFlatView={true}
							parentsCount={
								node.parentId === null
									? 0
									: eventsStore.getParentNodes(node.eventId, eventDataStore.eventsCache).length
							}
							isActive={
								eventsStore.selectedPath.length > 0 &&
								eventsStore.selectedPath[eventsStore.selectedPath.length - 1].eventId ===
									node.eventId
							}
						/>
					</div>
				)}
			</Observer>
		);
	};

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
		<div className='actions-list'>
			<StateSaverProvider>
				<Virtuoso
					ref={listRef}
					totalCount={nodes.length}
					computeItemKey={computeKey}
					overscan={3}
					itemContent={renderEvent}
					style={{ height: '100%' }}
					components={{
						Header: EventListHeader,
						Footer: EventListFooter,
					}}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(FlatEventList);
