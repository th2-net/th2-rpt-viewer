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
import { Virtuoso, VirtuosoMethods } from 'react-virtuoso';
import EventCardHeader from '../EventCardHeader';
import Empty from '../../Empty';
import SplashScreen from '../../SplashScreen';
import StateSaverProvider from '../../util/StateSaverProvider';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import { raf } from '../../../helpers/raf';
import CardDisplayType from '../../../util/CardDisplayType';
import { EventTreeNode } from '../../../models/EventAction';
import { getEventNodeParents } from '../../../helpers/event';
import '../../../styles/action.scss';

interface Props {
	nodes: EventTreeNode[];
}

function FlatEventList({ nodes }: Props) {
	const eventWindowStore = useEventWindowStore();
	const listRef = React.useRef<VirtuosoMethods | null>(null);

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
		return <Empty description='No events' />;
	}

	return (
		<div className='actions-list'>
			<StateSaverProvider>
				<Virtuoso
					ref={listRef}
					totalCount={nodes.length}
					computeItemKey={computeKey}
					overscan={3}
					item={renderEvent}
					style={{ height: '100%' }}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(FlatEventList);
