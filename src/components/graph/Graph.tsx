/** ****************************************************************************
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
import moment from 'moment';
import ResizeObserver from 'resize-observer-polyfill';
import GraphChunk, { AttachedItem } from './GraphChunk';
import GraphOverlay from './GraphOverlay';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { useActiveWorkspace, useGraphStore, useSelectedStore } from '../../hooks';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { Chunk } from '../../models/graph';
import { filterListByChunkRange } from '../../helpers/graph';
import { isEventNode } from '../../helpers/event';
import '../../styles/graph.scss';

const getChunkWidth = () => window.innerWidth / 2;

const settings: Settings = {
	itemWidth: getChunkWidth(),
	amount: 3,
	tolerance: 1,
	minIndex: -100,
	maxIndex: 100,
	startIndex: 0,
};

function Graph() {
	const graphStore = useGraphStore();
	const selectedStore = useSelectedStore();
	const activeWorkspace = useActiveWorkspace();

	const rootRef = React.useRef<HTMLDivElement>(null);

	const [chunkWidth, setChunkWidth] = React.useState(getChunkWidth);

	const [expandedAttachedItem, setExpandedAttachedItem] = React.useState<
		EventTreeNode | EventMessage | null
	>(null);

	const resizeObserver = React.useRef(
		new ResizeObserver(() => {
			setChunkWidth(getChunkWidth);
		}),
	);

	React.useEffect(() => {
		if (rootRef.current) resizeObserver.current.observe(rootRef.current);

		return () => {
			if (rootRef.current) resizeObserver.current.unobserve(rootRef.current);
		};
	}, []);

	const renderChunk = (chunk: Chunk, index: number) => {
		const attachedItems: AttachedItem[] = filterListByChunkRange(chunk, [
			...selectedStore.pinnedEvents,
			...selectedStore.attachedMessages,
			...selectedStore.pinnedMessages,
		]).map(item => ({
			value: item,
			type: isEventNode(item)
				? 'event'
				: selectedStore.attachedMessages.includes(item)
				? 'attached-message'
				: 'pinned-message',
		}));

		return (
			<div
				data-from={moment(chunk.from).startOf('minute').valueOf()}
				data-to={moment(chunk.to).endOf('minute').valueOf()}
				className='graph__chunk-item'
				data-index={index}
				key={`${chunk.from}-${chunk.to}`}
				style={{ width: chunkWidth }}>
				<GraphChunk
					tickSize={graphStore.steps[activeWorkspace.graphDataStore.interval]}
					interval={activeWorkspace.graphDataStore.interval}
					chunk={chunk}
					chunkWidth={chunkWidth}
					getChunkData={activeWorkspace.graphDataStore.getChunkData}
					attachedItems={attachedItems}
					expandedAttachedItem={expandedAttachedItem}
					setExpandedAttachedItem={onGraphItemClick}
				/>
			</div>
		);
	};

	const onGraphItemClick = (item: EventTreeNode | EventMessage | null) => {
		setExpandedAttachedItem(item);
		if (item !== null) activeWorkspace.onSavedItemSelect(item);
	};

	// 	<select
	// 		name='interval'
	// 		value={graphStore.interval}
	// 		onChange={e => graphStore.setInterval(parseInt(e.target.value) as IntervalOption)}>
	// 		{graphStore.intervalOptions.map(intervalValue => (
	// 			<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
	// 		))}
	// 	</select>

	const onInputSubmit = (timestamp: number) => {
		if (new Date(timestamp).valueOf() > 1) {
			activeWorkspace.graphDataStore.setTimestamp(timestamp);
		}
	};

	return (
		<div className='graph' ref={rootRef}>
			<GraphChunksVirtualizer
				chunkWidth={chunkWidth}
				settings={settings}
				setExpandedAttachedItem={setExpandedAttachedItem}
				renderChunk={renderChunk}
				setRange={activeWorkspace.graphDataStore.setRange}
				onRangeChanged={activeWorkspace.onRangeChange}
				getChunk={(timestamp: number, index: number) => {
					return activeWorkspace.graphDataStore.getChunkByTimestamp(
						moment(timestamp)
							.subtract(-index * activeWorkspace.graphDataStore.interval, 'minutes')
							.valueOf(),
					);
				}}
				interval={activeWorkspace.graphDataStore.interval}
				timestamp={activeWorkspace.graphDataStore.timestamp}
				key={activeWorkspace.graphDataStore.timestamp}
			/>
			<GraphOverlay
				chunkWidth={chunkWidth}
				range={activeWorkspace.graphDataStore.range}
				onInputSubmit={onInputSubmit}
			/>
		</div>
	);
}

export default observer(Graph);
