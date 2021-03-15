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
import { getEventNodeParents } from '../../../helpers/event';
import TreeHeader from '../TreeHeader';
import TreeFooter from '../TreeFooter';
import '../../../styles/action.scss';

interface Props {
	nodes: EventTreeNode[];
}

function FlatEventList({ nodes }: Props) {
	const eventWindowStore = useWorkspaceEventStore();
	const listRef = React.useRef<VirtuosoHandle | null>(null);

	React.useEffect(() => {
		try {
			raf(() => {
				if (eventWindowStore.scrolledIndex !== null) {
					listRef.current?.scrollToIndex({
						index: eventWindowStore.scrolledIndex.valueOf(),
						align: 'center',
					});
				}
			}, 3);
		} catch (e) {
			console.error(e);
		}
	}, [eventWindowStore.scrolledIndex, eventWindowStore.viewStore.flattenedListView]);

	const computeKey = (index: number) => nodes[index].eventId;

	const renderEvent = (index: number): React.ReactElement => {
		const node = nodes[index];
		return (
			<Observer>
				{() => (
					<div style={{ margin: '4px 5px' }}>
						<EventCardHeader
							childrenCount={0}
							event={node}
							displayType={CardDisplayType.MINIMAL}
							onSelect={() => eventWindowStore.selectNode(node)}
							isSelected={eventWindowStore.isNodeSelected(node)}
							isFlatView={true}
							parentsCount={getEventNodeParents(node).length}
							isActive={
								eventWindowStore.selectedPath.length > 0 &&
								eventWindowStore.selectedPath[eventWindowStore.selectedPath.length - 1].eventId ===
									node.eventId
							}
						/>
					</div>
				)}
			</Observer>
		);
	};

	if (eventWindowStore.isLoadingRootEvents) {
		return <SplashScreen />;
	}

	if (!eventWindowStore.isLoadingRootEvents && eventWindowStore.eventTree.length === 0) {
		if (eventWindowStore.eventTreeStatusCode === null) {
			return <Empty description='No events' />;
		}
		return (
			<Empty description={`Server responded with ${eventWindowStore.eventTreeStatusCode} code`} />
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
						Header: TreeHeader,
						Footer: TreeFooter,
					}}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(FlatEventList);
