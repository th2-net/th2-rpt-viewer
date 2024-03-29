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
import GraphItemsGroup from './GraphItemsGroup';
import { GraphStore } from '../../stores/GraphStore';
import { EventMessage } from '../../models/EventMessage';
import { GraphGroup, Chunk } from '../../models/Graph';
import { EventTreeNode } from '../../models/EventAction';
import { getGraphTimeTicks, groupGraphItems, filterListByChunkRange } from '../../helpers/graph';
import { useSelectedStore } from '../../hooks';

const ATTACHED_ITEM_SIZE = 14;

interface Props {
	chunk: Chunk;
	chunkWidth: number;
	getChunkData: InstanceType<typeof GraphStore>['getChunkData'];
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	interval: number;
	tickSize: number;
}

function GraphChunk(props: Props) {
	const {
		chunk,
		getChunkData,
		getGraphItemType,
		chunkWidth,
		onGraphItemClick,
		interval,
		tickSize,
	} = props;

	const selectedStore = useSelectedStore();

	React.useEffect(() => {
		const abortController = new AbortController();

		getChunkData(chunk, abortController.signal);

		return () => {
			abortController.abort();
		};
	}, []);

	const graphItems = React.useMemo(
		() => filterListByChunkRange([chunk.from, chunk.to], selectedStore.graphItems),
		[chunk.from, chunk.to, selectedStore.graphItems],
	);

	const ticks: Array<string> = React.useMemo(
		() => getGraphTimeTicks([chunk.from, chunk.to], interval, tickSize),
		[chunk.from, chunk.to, interval, tickSize],
	);

	const graphItemsGroups: Array<GraphGroup> = React.useMemo(
		() => groupGraphItems([chunk.from, chunk.to], chunkWidth, graphItems, ATTACHED_ITEM_SIZE),
		[chunk.from, chunk.to, chunkWidth, graphItems],
	);

	return (
		<div
			className='graph-chunk'
			data-from={chunk.from}
			data-to={chunk.to}
			style={{ width: chunkWidth }}>
			{graphItemsGroups.map(group => (
				<GraphItemsGroup
					key={group.left}
					group={group}
					onGraphItemClick={onGraphItemClick}
					getGraphItemType={getGraphItemType}
				/>
			))}
			<div className='graph-chunk__ticks'>
				{ticks.map(tick => (
					<span className='graph-chunk__tick' key={tick}>
						{tick}
					</span>
				))}
			</div>
		</div>
	);
}

export default observer(GraphChunk);
