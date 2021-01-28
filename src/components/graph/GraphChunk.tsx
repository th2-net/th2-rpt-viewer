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
import { getTimestampAsNumber, isTimeIntersected } from '../../helpers/date';
import { EventMessage } from '../../models/EventMessage';
import { Chunk, GraphItem } from '../../models/Graph';
import { EventTreeNode } from '../../models/EventAction';
import { isEventMessage } from '../../helpers/event';
import GraphAttachedItemGroup from './GraphAttachedItemGroup';
import { TimeRange } from '../../models/Timestamp';
import { GraphDataStore } from '../../stores/graph/GraphDataStore';

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

export interface AttachedItem {
	value: GraphItem;
	type: 'attached-message' | 'pinned-message' | 'event';
}

function getGraphTimeTicks(chunk: Chunk, interval: number, tickSize: number) {
	const ticksArr = [];
	const { from, to } = chunk;
	const ticksInterval = (to - from) / interval / 1000 / 60;

	for (let i = 0; i < interval; i += tickSize) {
		ticksArr.push(
			moment(from)
				.startOf('minute')
				.add(ticksInterval * i, 'minutes')
				.valueOf(),
		);
	}

	return ticksArr.map(tick => moment(tick).utc().format('HH:mm'));
}

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

	const ticks = React.useMemo(() => getGraphTimeTicks(chunk, interval, tickSize), [
		chunk,
		interval,
		tickSize,
	]);

	const attachedItemTimeSize = ((chunk.to - chunk.from) / chunkWidth) * ATTACHED_ITEM_SIZE;

	const attachedItemsGroups: {
		items: AttachedItem[];
		left: number;
	}[] = React.useMemo(() => {
		const groups: {
			range: TimeRange;
			items: AttachedItem[];
		}[] = [];

		const getGroupLeftPosition = (timestamp: number) => {
			const { from, to } = chunk;
			return Math.floor(((timestamp - from) / (to - from)) * chunkWidth);
		};

		attachedItems.forEach(item => {
			const itemTimestamp = getTimestampAsNumber(
				isEventMessage(item.value) ? item.value.timestamp : item.value.startTimestamp,
			);

			const itemRange: TimeRange = [
				itemTimestamp - attachedItemTimeSize / 2,
				itemTimestamp + attachedItemTimeSize / 2,
			];

			const targetGroup = groups.find(group => isTimeIntersected(group.range, itemRange));
			if (targetGroup) {
				targetGroup.items.push(item);
			} else {
				groups.push({
					range: itemRange,
					items: [item],
				});
			}
		});

		return groups.map(group => {
			const groupFirstItem = group.items[0];
			const left = getGroupLeftPosition(
				moment(
					getTimestampAsNumber(
						isEventMessage(groupFirstItem.value)
							? groupFirstItem.value.timestamp
							: groupFirstItem.value.startTimestamp,
					),
				).valueOf(),
			);
			return {
				items: group.items,
				left,
			};
		});
	}, [attachedItems]);

	return (
		<div className='graph-chunk' data-from={chunk.from} data-to={chunk.to}>
			{attachedItemsGroups.map((group, index) => (
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
