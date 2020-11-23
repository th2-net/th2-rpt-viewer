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
import { LineChart, Line, CartesianGrid, XAxis, TooltipProps } from 'recharts';
import { EventTreeNode } from '../../models/EventAction';

const data: {
	name: string;
	uv: number;
	pv: number;
	amt: number;
}[] = [];

for (let i = 0; i < 15; i++) {
	data.push({
		name: (i + 1).toString(),
		uv: Math.floor(Math.random() * 5000),
		pv: Math.floor(Math.random() * 5000),
		amt: Math.floor(Math.random() * 5000),
	});
}

interface Props {
	data: any;
}

const GraphChunk = (props: Props) => {
	return (
		<div style={{ position: 'relative' }}>
			<LineChart
				width={window.innerWidth / 3}
				height={80}
				data={props.data}
				margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
				<XAxis
					dataKey='x'
					tick={{
						fill: 'white',
						fontSize: 12,
						fontFamily: 'OpenSans',
						userSelect: 'none',
					}}
					stroke='rgba(0,0,0,0)'
				/>
				<CartesianGrid stroke='#f5f5f5' vertical={true} horizontal={false} color='#9aaac9' />
				<Line
					type='monotone'
					dataKey='x'
					stroke='#ff7300'
					yAxisId={0}
					animationDuration={0}
					activeDot={false}
					dot={false}
				/>
				<Line
					type='monotone'
					dataKey='y'
					stroke='#387908'
					yAxisId={1}
					animationDuration={0}
					dot={false}
				/>
			</LineChart>
		</div>
	);
};

export default GraphChunk;
