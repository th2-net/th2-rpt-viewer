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
import GraphSearch from './search/GraphSearch';
import OutsideItems from './OutsideItems';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { useActiveWorkspace, useSelectedStore } from '../../hooks';
import { Chunk, PanelRange } from '../../models/Graph';
import WorkspaceStore from '../../stores/workspace/WorkspaceStore';
import { isWorkspaceStore } from '../../helpers/workspace';
import PointerTimestampProvider from '../../contexts/pointerTimestampContext';
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

interface GraphProps {
	activeWorkspace: WorkspaceStore;
}

function Graph({ activeWorkspace }: GraphProps) {
	const selectedStore = useSelectedStore();

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

	const renderChunk = (chunk: Chunk, index: number) => {
		return (
			<Observer key={`${chunk.from}-${chunk.to}`}>
				{() => (
					<div
						data-from={moment.utc(chunk.from).valueOf()}
						data-to={moment.utc(chunk.to).valueOf()}
						className='graph__chunk-item'
						data-index={index}
						style={{ width: chunkWidth }}>
						<GraphChunk
							key={`${chunk.from}-${chunk.to}`}
							tickSize={activeWorkspace.graphStore.tickSize}
							interval={activeWorkspace.graphStore.interval}
							chunk={chunk}
							chunkWidth={chunkWidth}
							getChunkData={activeWorkspace.graphStore.getChunkData}
							getGraphItemType={activeWorkspace.graphStore.getGraphItemType}
							onGraphItemClick={activeWorkspace.onSavedItemSelect}
						/>
					</div>
				)}
			</Observer>
		);
	};

	return (
		<div className='graph' ref={rootRef}>
			<GraphChunksVirtualizer
				renderChunk={renderChunk}
				getChunk={getChunk}
				chunkWidth={chunkWidth}
				settings={settings}
				panelsRange={panelsRange}
				setRange={activeWorkspace.graphStore.setRange}
				interval={activeWorkspace.graphStore.interval}
				timestamp={activeWorkspace.graphStore.timestamp}
				range={activeWorkspace.graphStore.range}
			/>
			<OutsideItems
				onGraphItemClick={activeWorkspace.onSavedItemSelect}
				getGraphItemType={activeWorkspace.graphStore.getGraphItemType}
				panelsRange={panelsRange}
				graphItems={selectedStore.graphItems}
				range={activeWorkspace.graphStore.range}
				onPanelRangeSelect={activeWorkspace.graphStore.setTimestampFromRange}
				goToGraphItem={activeWorkspace.graphStore.goToGraphItem}
			/>
		</div>
	);
}

const ObservedGraph = observer(Graph);

const GraphRoot = () => {
	const activeWorkspace = useActiveWorkspace();

	return (
		<PointerTimestampProvider>
			<div className='graph-root'>
				<i className='th2-logo' />
				<GraphSearch
					hoveredTimestamp={
						isWorkspaceStore(activeWorkspace) ? activeWorkspace.graphStore.hoveredTimestamp : null
					}
					refreshPanels={isWorkspaceStore(activeWorkspace) ? activeWorkspace.refreshPanels : null}
					onTimestampSubmit={activeWorkspace.onTimestampSelect}
					onFoundItemClick={activeWorkspace.onSavedItemSelect}
					windowRange={isWorkspaceStore(activeWorkspace) ? activeWorkspace.graphStore.range : null}
				/>
				{isWorkspaceStore(activeWorkspace) && <ObservedGraph activeWorkspace={activeWorkspace} />}
			</div>
		</PointerTimestampProvider>
	);
};

export default observer(GraphRoot);
