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
import { LineChart, Line, CartesianGrid, XAxis, LineProps, CartesianGridProps } from 'recharts';
import { getTimestampAsNumber } from '../../helpers/date';
import { EventMessage } from '../../models/EventMessage';
import { Chunk } from '../../models/graph';

const tickStyles: React.CSSProperties = {
	fill: 'white',
	fontSize: 12,
	fontFamily: 'OpenSans',
	userSelect: 'none',
};

const lineProps: LineProps = {
	dataKey: '',
	type: 'monotone',
	yAxisId: 0,
	animationDuration: 0,
	activeDot: false,
	dot: false,
};

const gridProps: CartesianGridProps = {
	stroke: '#f5f5f5',
	vertical: true,
	horizontal: false,
	color: '#9aaac9',
};

const graphLines = [
	{
		dataKey: 'passed',
		stroke: '#00802a',
	},
	{
		dataKey: 'failed',
		stroke: '#c20a0a',
	},
	{
		dataKey: 'messages',
		stroke: '#2689bd',
	},
];

interface Props {
	chunk: Chunk;
	chunkWidth: number;
	getChunkData: (chunk: Chunk) => void;
	attachedMessages: EventMessage[];
}

const GraphChunk: React.ForwardRefRenderFunction<HTMLDivElement, Props> = (props, ref) => {
	const { chunk, getChunkData, attachedMessages, chunkWidth } = props;

	React.useEffect(() => {
		getChunkData(chunk);
	}, []);

	const getMessagesLeftPosition = (timestamp: number) => {
		const { from, to } = chunk;
		return ((timestamp - from) / (to - from)) * 100;
	};

	const ticks: number[] = React.useMemo(() => {
		const ticksArr = [];
		const { from, to } = chunk;
		const ticksInterval = (to - from) / 15 / 1000 / 60;

		for (let i = 0; i < 16; i++) {
			ticksArr.push(
				moment(from)
					.startOf('minute')
					.add(ticksInterval * i, 'minutes')
					.valueOf(),
			);
		}
		return ticksArr;
	}, [chunk]);

	return (
		<div className='graph-chunk' ref={ref} data-from={chunk.from} data-to={chunk.to}>
			{attachedMessages.map(message => (
				<div
					key={message.messageId}
					className='graph-chunk__message'
					style={{
						left: `${getMessagesLeftPosition(getTimestampAsNumber(message.timestamp))}%`,
						top: 20,
					}}
				/>
			))}
			<LineChart
				width={chunkWidth}
				height={60}
				data={chunk.data}
				margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
				<XAxis
					dataKey='timestamp'
					domain={['auto', 'auto']}
					tickFormatter={tick => moment(tick).format('HH:mm')}
					// type='number'
					// ticks={ticks}
					tick={tickStyles}
					stroke='rgba(0,0,0,0)'
					interval={2}
				/>
				<CartesianGrid {...gridProps} />
				{graphLines.map(line => (
					<Line key={line.dataKey} {...lineProps} {...line} />
				))}
			</LineChart>
		</div>
	);
};

export default observer<Props, HTMLDivElement>(GraphChunk, { forwardRef: true });
