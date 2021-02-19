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
import { Virtuoso, VirtuosoMethods } from 'react-virtuoso';
import EventTree from './EventTree';
import Empty from '../../util/Empty';
import SplashScreen from '../../SplashScreen';
import StateSaverProvider from '../../util/StateSaverProvider';
import { useWorkspaceEventStore } from '../../../hooks';
import { raf } from '../../../helpers/raf';
import { EventTreeNode } from '../../../models/EventAction';
import '../../../styles/action.scss';
import { getTimestampAsNumber } from '../../../helpers/date';

interface Props {
	nodes: EventTreeNode[];
}

function EventTreeList({ nodes }: Props) {
	const eventWindowStore = useWorkspaceEventStore();
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
	}, [eventWindowStore.scrolledIndex]);

	const getTimestamps = (eventNodes: EventTreeNode[], selectedPath: EventTreeNode[]) => {
		if (!eventNodes.length || !selectedPath.length) return null;

		const selectedRootEventId = selectedPath[0].eventId;
		const rootEventIndex = eventNodes.findIndex(e => e.eventId === selectedRootEventId);

		const timestamps = {
			startEventId: selectedRootEventId,
			startTimestamp: getTimestampAsNumber(eventNodes[rootEventIndex].startTimestamp),
			endEventId: selectedRootEventId,
			endTimestamp: getTimestampAsNumber(eventNodes[rootEventIndex].startTimestamp),
		};

		if (
			eventNodes[rootEventIndex].childList.length &&
			eventNodes[rootEventIndex + 1] &&
			eventNodes[rootEventIndex + 1].parentId === selectedRootEventId
		) {
			timestamps.startTimestamp = getTimestampAsNumber(
				eventNodes[rootEventIndex + 1].startTimestamp,
			);
			timestamps.endTimestamp = timestamps.startTimestamp;

			for (
				let i = rootEventIndex + 1;
				eventNodes[i] && eventNodes[i].parents![0] === selectedRootEventId;
				i++
			) {
				timestamps.endEventId = eventNodes[i].eventId;

				if (eventNodes[i].parents?.length === 1) {
					const eventTimestamp = getTimestampAsNumber(eventNodes[i].startTimestamp);

					if (eventTimestamp < timestamps.startTimestamp) {
						timestamps.startTimestamp = eventTimestamp;
					}

					if (eventTimestamp > timestamps.endTimestamp) {
						timestamps.endTimestamp = eventTimestamp;
					}
				}
			}
		}

		return timestamps;
	};

	const timestamps = getTimestamps(nodes, eventWindowStore.selectedPath);

	const computeKey = (index: number) => nodes[index].eventId;

	const renderEvent = (index: number): React.ReactElement => (
		<EventTree
			eventTreeNode={nodes[index]}
			startTimestamp={
				timestamps?.startEventId === nodes[index].eventId ? timestamps.startTimestamp : undefined
			}
			endTimestamp={
				timestamps?.endEventId === nodes[index].eventId ? timestamps.endTimestamp : undefined
			}
		/>
	);

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
					item={renderEvent}
					style={{ height: '100%' }}
				/>
			</StateSaverProvider>
		</div>
	);
}

export default observer(EventTreeList);
