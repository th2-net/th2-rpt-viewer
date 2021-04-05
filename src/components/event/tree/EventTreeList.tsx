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
import EventTree from './EventTree';
import Empty from '../../util/Empty';
import SplashScreen from '../../SplashScreen';
import StateSaverProvider from '../../util/StateSaverProvider';
import { useWorkspaceEventStore } from '../../../hooks';
import { raf } from '../../../helpers/raf';
import { EventTreeNode } from '../../../models/EventAction';
import { EventListFooter, EventListHeader } from '../EventListNavigation';
import '../../../styles/action.scss';
import useEventsDataStore from '../../../hooks/useEventsDataStore';

interface Props {
	nodes: EventTreeNode[];
}

function EventTreeList({ nodes }: Props) {
	const eventWindowStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();

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
	}, [eventWindowStore.scrolledIndex]);

	const computeKey = (index: number) => nodes[index].eventId;

	const renderEvent = (index: number): React.ReactElement => {
		const node = nodes[index];

		let isLastChild = false;
		let parentHasMoreChilds = false;

		if (node.parentId !== null) {
			const siblings = eventDataStore.parentChildrensMap.get(node.parentId) || [];
			isLastChild = siblings.length > 0 && siblings[siblings.length - 1].eventId === node.eventId;
			parentHasMoreChilds = eventDataStore.hasUnloadedChildren.get(node.parentId) === true;
		}

		const showLoadButton = isLastChild && parentHasMoreChilds;

		return <EventTree eventTreeNode={node} showLoadButton={showLoadButton} />;
	};

	if (eventDataStore.rootEventIds.length === 0) {
		if (eventDataStore.isLoadingRootEvents) {
			return <SplashScreen />;
		}
		if (!eventDataStore.isLoadingRootEvents && !eventDataStore.isError) {
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

export default observer(EventTreeList);
