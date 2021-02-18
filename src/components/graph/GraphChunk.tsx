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
import { LineChart, Line, LineProps } from 'recharts';
import GraphItemsGroup from './GraphItemsGroup';
import { GraphStore } from '../../stores/GraphStore';
import { EventMessage } from '../../models/EventMessage';
import { GraphGroup, Chunk } from '../../models/Graph';
import { EventTreeNode } from '../../models/EventAction';
import { getGraphTimeTicks, groupGraphItems, filterListByChunkRange } from '../../helpers/graph';
import { useSelectedStore } from '../../hooks';
import { TimeRange } from '../../models/Timestamp';

const ATTACHED_ITEM_SIZE = 14;

const lineProps: LineProps = {
	dataKey: '',
	type: 'linear',
	yAxisId: 0,
	animationDuration: 0,
	activeDot: false,
	dot: false,
} as const;

const graphLines = [
	{
		dataKey: 'passed',
		stroke: '#00802A',
	},
	{
		dataKey: 'failed',
		stroke: '#C20A0A',
	},
	{
		dataKey: 'messages',
		stroke: '#2689BD',
	},
] as const;

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

	const chunkBoundaries: TimeRange = React.useMemo(() => {
		return [
			moment(chunk.from).startOf('minute').valueOf(),
			moment(chunk.to).startOf('minute').valueOf(),
		];
	}, [chunk.from, chunk.to]);

	const graphItems = React.useMemo(() => {
		return filterListByChunkRange(chunkBoundaries, selectedStore.graphItems);
	}, [chunkBoundaries, selectedStore.graphItems]);

	const ticks: Array<string> = React.useMemo(() => {
		return getGraphTimeTicks(chunkBoundaries, interval, tickSize);
	}, [chunkBoundaries, interval, tickSize]);

	const graphItemsGroups: Array<GraphGroup> = React.useMemo(() => {
		return groupGraphItems(chunkBoundaries, chunkWidth, graphItems, ATTACHED_ITEM_SIZE);
	}, [chunkBoundaries, chunkWidth, graphItems]);

	return (
		<div className='graph-chunk' data-from={chunk.from} data-to={chunk.to}>
			{graphItemsGroups.map(group => (
				<GraphItemsGroup
					key={group.left}
					group={group}
					onGraphItemClick={onGraphItemClick}
					getGraphItemType={getGraphItemType}
				/>
			))}
			<LineChart
				width={chunkWidth}
				height={50}
				data={chunk.data}
				margin={{ top: 0, right: 0, left: 0, bottom: 5 }}
				style={{
					zIndex: 5,
					cursor: 'inherit',
				}}>
				{graphLines.map(line => (
					<Line key={line.dataKey} {...lineProps} {...line} />
				))}
			</LineChart>
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
