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
import { Observer, observer } from 'mobx-react-lite';
import moment from 'moment';
import ResizeObserver from 'resize-observer-polyfill';
import GraphChunk from './GraphChunk';
import GraphOverlay from './GraphOverlay';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { useActiveWorkspace, useSelectedStore } from '../../hooks';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { Chunk, PanelRange } from '../../models/Graph';
import '../../styles/graph.scss';

const getChunkWidth = () => window.innerWidth / 2;

const settings: Settings = {
	itemWidth: getChunkWidth(),
	amount: 3,
	tolerance: 1,
	minIndex: -100,
	maxIndex: 100,
	startIndex: 0,
} as const;

function Graph() {
	const selectedStore = useSelectedStore();
	const activeWorkspace = useActiveWorkspace();

	const rootRef = React.useRef<HTMLDivElement>(null);

	const [chunkWidth, setChunkWidth] = React.useState(getChunkWidth);

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

	const onGraphItemClick = React.useCallback(
		(item: EventTreeNode | EventMessage) => {
			activeWorkspace.onSavedItemSelect(item);
		},
		[activeWorkspace.onSavedItemSelect],
	);

	const getGraphItemType = React.useCallback(activeWorkspace.graphStore.getGraphItemType, [
		selectedStore.attachedMessages,
		selectedStore.graphItems,
	]);

	const renderChunk = (chunk: Chunk, index: number) => {
		return (
			<Observer key={`${chunk.from}-${chunk.to}`}>
				{() => (
					<div
						data-from={moment(chunk.from).startOf('minute').valueOf()}
						data-to={moment(chunk.to).endOf('minute').valueOf()}
						className='graph__chunk-item'
						data-index={index}
						style={{ width: chunkWidth }}>
						<GraphChunk
							tickSize={activeWorkspace.graphStore.tickSize}
							interval={activeWorkspace.graphStore.interval}
							chunk={chunk}
							chunkWidth={chunkWidth}
							getChunkData={activeWorkspace.graphStore.getChunkData}
							getGraphItemType={getGraphItemType}
							onGraphItemClick={onGraphItemClick}
						/>
					</div>
				)}
			</Observer>
		);
	};

	const getChunk = React.useCallback(
		(timestamp: number, index: number) => {
			return activeWorkspace.graphStore.getChunkByTimestamp(
				moment(timestamp)
					.subtract(-index * activeWorkspace.graphStore.interval, 'minutes')
					.valueOf(),
			);
		},
		[activeWorkspace, activeWorkspace.graphStore.interval],
	);

	const panelsRange: Array<PanelRange> = React.useMemo(() => {
		return [
			{
				type: 'events-panel',
				range: activeWorkspace.eventsStore.panelRange,
				setRange: activeWorkspace.eventsStore.onRangeChange,
			},
			{
				type: 'messages-panel',
				range: activeWorkspace.messagesStore.panelRange,
				setRange: activeWorkspace.messagesStore.onRangeChange,
			},
		];
	}, [activeWorkspace.eventsStore.panelRange, activeWorkspace.messagesStore.panelRange]);

	return (
		<div className='graph' ref={rootRef}>
			{!activeWorkspace.isSearchWorkspace && (
				<GraphChunksVirtualizer
					chunkWidth={chunkWidth}
					settings={settings}
					renderChunk={renderChunk}
					setRange={activeWorkspace.graphStore.setRange}
					getChunk={getChunk}
					interval={activeWorkspace.graphStore.interval}
					timestamp={activeWorkspace.graphStore.timestamp}
					key={activeWorkspace.graphStore.timestamp}
					panelsRange={panelsRange}
					range={activeWorkspace.graphStore.range}
				/>
			)}
			<GraphOverlay
				range={activeWorkspace.graphStore.range}
				onGraphItemClick={onGraphItemClick}
				getGraphItemType={getGraphItemType}
				panelsRange={panelsRange}
				disableInteractions={activeWorkspace.isSearchWorkspace}
			/>
		</div>
	);
}

export default observer(Graph);

// 	<select
// 		name='interval'
// 		value={graphStore.interval}
// 		onChange={e => graphStore.setInterval(parseInt(e.target.value) as IntervalOption)}>
// 		{graphStore.intervalOptions.map(intervalValue => (
// 			<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
// 		))}
// 	</select>
