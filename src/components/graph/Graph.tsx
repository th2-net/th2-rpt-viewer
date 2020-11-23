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
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import GraphChunk from './GraphChunk';
import '../../styles/graph.scss';
import { useGraphStore } from '../../hooks/useGraphStore';

const rangeSelectorStyles: React.CSSProperties = {
	height: '100%',
	borderLeft: '3px solid #ff5500',
	borderRight: '3px solid #ff5500',
	position: 'absolute',
	top: 0,
	backdropFilter: 'brightness(119%)',
	// pointerEvents: 'none',
};

const intervalOptions = [15, 30, 60];

function Graph() {
	const graphStore = useGraphStore();
	const graphChunks = React.useRef<HTMLDivElement>(null);
	const [offset, setOffset] = React.useState(0);

	const onWheelHandler = (e: React.WheelEvent<HTMLElement>) => {
		if (!graphChunks.current) return;
		const direction = e.deltaY > 0 ? 1 : -1;
		setOffset(offset + direction * 50);
	};

	React.useEffect(() => {
		if (offset <= -600) {
			graphStore.setTimestamp(
				moment(graphStore.timestamp).add(graphStore.interval, 'minutes').valueOf(),
			);
			setOffset(0);
		}

		if (offset >= 600) {
			graphStore.setTimestamp(
				moment(graphStore.timestamp).subtract(graphStore.interval, 'minutes').valueOf(),
			);
			setOffset(0);
		}
	}, [offset]);

	const moveGraph = (direction: 1 | -1) => {
		if (!graphChunks.current) return;
		const style = getComputedStyle(graphChunks.current);
		const matrix = new WebKitCSSMatrix(style.webkitTransform);
		graphChunks.current.style.transform = `translate(${matrix.m41 + direction * 55}px, 0)`;
	};

	const windowWidth = window.innerWidth;

	return (
		<div className='graph' onWheel={onWheelHandler}>
			<div
				className='graph__chunks'
				ref={graphChunks}
				style={{ transform: `translateX(${offset}px)` }}>
				{graphStore.timelineData.map((chunkData, i) => (
					<GraphChunk key={i} data={chunkData} />
				))}
			</div>
			<div
				style={{
					...rangeSelectorStyles,
					width: windowWidth / 3,
					left: windowWidth / 3,
				}}>
				<select name='interval' defaultValue={15}>
					{intervalOptions.map(intervalValue => (
						<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
					))}
				</select>
			</div>
		</div>
	);
}

export default observer(Graph);
