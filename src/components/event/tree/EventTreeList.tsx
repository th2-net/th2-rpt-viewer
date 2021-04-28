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
import useEventsDataStore from '../../../hooks/useEventsDataStore';
import '../../../styles/action.scss';

const EVENT_NODE_HEIGHT = 25;

interface Props {
	nodes: EventTreeNode[];
}

function EventTreeList({ nodes }: Props) {
	const eventWindowStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();

	const listRef = React.useRef<VirtuosoHandle | null>(null);

	let knowns: EventTreeNode[] = [];
	let unknowns: EventTreeNode[] = [];

	for (const node of nodes) {
		if (node.isUnknown) {
			unknowns = [...unknowns, node];
			// eslint-disable-next-line no-continue
			continue;
		}
		knowns = [...knowns, node];
	}

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

	const computeKeyFactory = (nodeList: EventTreeNode[]) => (index: number) =>
		nodeList[index].eventId;

	const renderEventFactory = (nodeList: EventTreeNode[]) => (index: number): React.ReactElement => {
		const node = nodeList[index];

		return <EventTree eventTreeNode={node} />;
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

	function Footer() {
		if (!unknowns.length) {
			return null;
		}

		return (
			<div className='unknowns'>
				<p className='unknowns__title'>Unknown Events</p>
				<Virtuoso
					className='unknowns__list'
					totalCount={unknowns.length}
					computeItemKey={computeKeyFactory(unknowns)}
					itemContent={renderEventFactory(unknowns)}
					style={{ height: `${unknowns.length * EVENT_NODE_HEIGHT}px` }}
				/>
			</div>
		);
	}

	return (
		<div className='actions-list'>
			<StateSaverProvider>
				<Virtuoso
					ref={listRef}
					totalCount={knowns.length}
					computeItemKey={computeKeyFactory(knowns)}
					overscan={3}
					itemContent={renderEventFactory(knowns)}
					style={{ height: '100%' }}
					components={{
						Footer,
					}}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(EventTreeList);
