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
import { EventIdNode } from '../../../stores/EventsStore';
import CardDisplayType from '../../../util/CardDisplayType';
import '../../../styles/action.scss';

interface Props {
	nodes: EventIdNode[];
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

	const computeKey = (index: number) => nodes[index].id;

	const renderEvent = (index: number): React.ReactElement => {
		const node = nodes[index];
		return (
			<Observer>
				{() => (
					<div style={{ margin: '4px 5px' }}>
						<EventCardHeader
							isRoot={node.parents.length === 0}
							childrenCount={0}
							event={node.event}
							displayType={CardDisplayType.MINIMAL}
							onSelect={() => eventWindowStore.selectNode(node)}
							isSelected={eventWindowStore.selectedNode === node}
						/>
					</div>
				)}
			</Observer>

		);
	};

	if (eventWindowStore.isLoadingRootEvents) {
		return <SplashScreen/>;
	}

	if (!eventWindowStore.isLoadingRootEvents && eventWindowStore.eventsIds.length === 0) {
		return <Empty description="No events"/>;
	}

	return (
		<div className="actions-list">
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
