/* eslint-disable max-len */
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
import { observer } from 'mobx-react-lite';
import { LineChart, Line, LineProps } from 'recharts';
import { getTimestampAsNumber } from '../../helpers/date';
import { EventMessage } from '../../models/EventMessage';
import { Chunk } from '../../models/graph';
import { EventAction } from '../../models/EventAction';
import { isEventMessage } from '../../helpers/event';
import GraphAttachedItem from './GraphAttachedItem';

const lineProps: LineProps = {
	dataKey: '',
	type: 'linear',
	yAxisId: 0,
	animationDuration: 0,
	activeDot: false,
	dot: false,
};

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
];

interface Props {
	chunk: Chunk;
	chunkWidth: number;
	getChunkData: (chunk: Chunk) => void;
	attachedItems: (EventMessage | EventAction)[];
	interval: number;
}

const GraphChunk: React.ForwardRefRenderFunction<HTMLDivElement, Props> = (props, ref) => {
	const { chunk, getChunkData, attachedItems, chunkWidth, interval } = props;

	React.useEffect(() => {
		getChunkData(chunk);
	}, []);

	const getAttachedItemsLeftPosition = (timestamp: number) => {
		const { from, to } = chunk;
		return ((timestamp - from) / (to - from)) * 100;
	};

	const ticks: number[] = React.useMemo(() => {
		const ticksArr = [];
		const { from, to } = chunk;
		const ticksInterval = (to - from) / 15 / 1000 / 60;

		for (let i = 0; i < interval; i++) {
			ticksArr.push(
				moment(from)
					.subtract(moment().utcOffset(), 'minutes')
					.startOf('minute')
					.add(ticksInterval * i, 'minutes')
					.valueOf(),
			);
		}

		return ticksArr;
	}, [chunk]);

	return (
		<div className='graph-chunk' ref={ref} data-from={chunk.from} data-to={chunk.to}>
			{attachedItems.map(item => (
				<GraphAttachedItem
					key={isEventMessage(item) ? item.messageId : item.eventId}
					item={item}
					left={getAttachedItemsLeftPosition(
						getTimestampAsNumber(isEventMessage(item) ? item.timestamp : item.startTimestamp),
					)}
					bottom={10}
				/>
			))}
			<LineChart
				width={chunkWidth}
				height={50}
				data={chunk.data}
				margin={{ top: 0, right: 0, left: 0, bottom: 5 }}
				style={{
					zIndex: 5,
				}}>
				{graphLines.map(line => (
					<Line key={line.dataKey} {...lineProps} {...line} />
				))}
			</LineChart>
			<div className='graph-chunk__ticks'>
				{ticks.map(tick => (
					<span className='graph-chunk__tick' key={tick}>
						{moment(tick).format('HH:mm')}
					</span>
				))}
			</div>
		</div>
	);
};

export default observer<Props, HTMLDivElement>(GraphChunk, { forwardRef: true });
