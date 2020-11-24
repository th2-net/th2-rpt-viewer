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

import moment from 'moment';
import * as React from 'react';
import { LineChart, Line, CartesianGrid, XAxis } from 'recharts';
import { getTimestampAsNumber } from '../../helpers/date';
import { useGraphStore } from '../../hooks/useGraphStore';
import { EventMessage } from '../../models/EventMessage';

interface GraphChunkProps {
	from: number;
	to: number;
	attachedMessages: EventMessage[];
}

const GraphChunk = ({ from, to, attachedMessages }: GraphChunkProps) => {
	const graphStore = useGraphStore();

	const chunkData = React.useMemo(() => graphStore.loadChunkData(from, to), [from, to]);

	const getMessagesLeftPosition = (timestamp: number) => {
		return ((timestamp - from) / (to - from)) * 100;
	};

	const ticks: number[] = React.useMemo(() => {
		const ticksArr = [];
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
	}, [from, to]);

	return (
		<div className='graph-chunk' style={{ position: 'relative' }}>
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
				width={800}
				height={100}
				data={chunkData}
				margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
				style={{
					overflow: 'visible',
				}}>
				<XAxis
					dataKey='timestamp'
					type='number'
					domain={[from, to]}
					tickFormatter={tick => moment(tick).format('HH:mm')}
					ticks={ticks}
					tick={{
						fill: 'white',
						fontSize: 12,
						fontFamily: 'OpenSans',
						userSelect: 'none',
					}}
					stroke='rgba(0,0,0,0)'
					interval={0}
				/>
				<CartesianGrid stroke='#f5f5f5' vertical={true} horizontal={false} color='#9aaac9' />
				<Line
					dataKey='passed'
					stroke='#ff7300'
					xAxisId={0}
					animationDuration={0}
					activeDot={false}
					dot={false}
				/>
				<Line
					dataKey='failed'
					stroke='#387908'
					xAxisId={0}
					animationDuration={0}
					activeDot={false}
					dot={false}
				/>
				<Line
					dataKey='messages'
					stroke='#387908'
					xAxisId={0}
					animationDuration={0}
					activeDot={false}
					dot={false}
				/>
			</LineChart>
		</div>
	);
};

export default GraphChunk;
