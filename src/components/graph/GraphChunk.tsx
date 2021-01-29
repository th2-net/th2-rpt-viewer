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
import moment from 'moment';
import { LineChart, Line, LineProps } from 'recharts';
import GraphAttachedItemGroup from './GraphAttachedItemGroup';
import { GraphDataStore } from '../../stores/graph/GraphDataStore';
import { EventMessage } from '../../models/EventMessage';
import { AttachedItem, AttachedItemGroup, Chunk } from '../../models/Graph';
import { EventTreeNode } from '../../models/EventAction';
import { getGraphTimeTicks, groupGraphItems } from '../../helpers/graph';

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
	getChunkData: InstanceType<typeof GraphDataStore>['getChunkData'];
	attachedItems: AttachedItem[];
	expandedAttachedItem: EventTreeNode | EventMessage | null;
	setExpandedAttachedItem: (item: EventTreeNode | EventMessage | null) => void;
	interval: number;
	tickSize: number;
}

function GraphChunk(props: Props) {
	const {
		chunk,
		getChunkData,
		attachedItems,
		chunkWidth,
		expandedAttachedItem,
		setExpandedAttachedItem,
		interval,
		tickSize,
	} = props;

	React.useEffect(() => {
		const abortController = new AbortController();

		getChunkData(chunk, abortController.signal);

		return () => {
			abortController.abort();
		};
	}, []);

	const ticks: Array<string> = React.useMemo(() => {
		const [from, to] = [
			moment(chunk.from).startOf('minute').valueOf(),
			moment(chunk.to).startOf('minute').valueOf(),
		];

		return getGraphTimeTicks(from, to, interval, tickSize);
	}, [chunk, interval, tickSize]);

	const graphItemsGroups: Array<AttachedItemGroup> = React.useMemo(() => {
		const [from, to] = [
			moment(chunk.from).startOf('minute').valueOf(),
			moment(chunk.to).startOf('minute').valueOf(),
		];

		return groupGraphItems(from, to, chunkWidth, attachedItems, ATTACHED_ITEM_SIZE);
	}, [chunk, chunkWidth, attachedItems]);

	return (
		<div className='graph-chunk' data-from={chunk.from} data-to={chunk.to}>
			{graphItemsGroups.map((group, index) => (
				<GraphAttachedItemGroup
					key={index}
					group={group}
					expandedAttachedItem={expandedAttachedItem}
					setExpandedAttachedItem={setExpandedAttachedItem}
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

export default React.memo(GraphChunk);
