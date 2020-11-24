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
import { Chunk } from '../../models/graph';

const tickStyles: React.CSSProperties = {
	fill: 'white',
	fontSize: 12,
	fontFamily: 'OpenSans',
	userSelect: 'none',
};

const lineProps: LineProps = {
	type: 'monotone',
	dataKey: 'count',
	stroke: '#ff7300',
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

interface Props {
	chunk: Chunk;
	getChunkData: (chunk: Chunk) => void;
}

const GraphChunk: React.RefForwardingComponent<HTMLDivElement, Props> = (props, ref) => {
	const { chunk, getChunkData } = props;

	React.useEffect(() => {
		getChunkData(chunk);
	}, []);

	return (
		<div className='chunk' ref={ref} data-from={chunk.from} data-to={chunk.to}>
			<LineChart
				width={window.innerWidth / 3}
				height={80}
				data={chunk.data}
				margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
				<XAxis
					dataKey='timestamp'
					tick={tickStyles}
					stroke='rgba(0,0,0,0)'
					tickFormatter={tick => moment(tick).format('HH:mm')}
					domain={['auto', 'auto']}
				/>
				<CartesianGrid {...gridProps} />
				<Line {...lineProps} />
				<Line {...lineProps} />
			</LineChart>
		</div>
	);
};

export default observer<Props, HTMLDivElement>(GraphChunk, { forwardRef: true });
