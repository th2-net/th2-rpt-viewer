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
import { useGraphStore } from '../../hooks/useGraphStore';
import { getTimestampAsNumber } from '../../helpers/date';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { isDivElement, isElementInViewport } from '../../helpers/dom';
import '../../styles/graph.scss';

const rangeSelectorStyles: React.CSSProperties = {
	height: '100%',
	borderLeft: '3px solid #ff5500',
	borderRight: '3px solid #ff5500',
	position: 'absolute',
	top: 0,
	backdropFilter: 'brightness(119%)',
	// pointerEvents: 'none',
};

function Graph() {
	const graphStore = useGraphStore();
	const selectedStore = useSelectedStore();

	const windowWidth = window.innerWidth / 3;
	const graphChunks = React.useRef<HTMLDivElement>(null);

	const onWheelHandler = (e: React.WheelEvent<HTMLElement>) => {
		if (!graphChunks.current) return;
		const direction = e.deltaY > 0 ? 1 : -1;
		const { left, width } = graphChunks.current.getBoundingClientRect();
		const style = getComputedStyle(graphChunks.current);
		const matrix = new WebKitCSSMatrix(style.webkitTransform);
		const translateX = matrix.m41 + direction * 100;
		const leftProp = parseInt(style.marginLeft.replace('px', ''));
		const right = 1920 - (left + width);
		graphChunks.current.style.transform = `translate(${translateX}px, 0)`;
		if (left > -150) {
			graphStore.addPreviousChunk();
			graphChunks.current.style.marginLeft = `${leftProp - left - windowWidth}px`;
		} else if (right > -150) {
			graphStore.addNextChunk();
			graphChunks.current.style.marginLeft = `${leftProp + right + windowWidth}px`;
		}

		// const childrenInInterval = Array.from(graphChunks.current.children)
		// 	.filter(isDivElement)
		// 	.filter(isElementInViewport);
	};

	return (
		<div className='graph' onWheel={onWheelHandler}>
			<div className='graph__container'>
				<div className='graph__chunks' ref={graphChunks}>
					{graphStore.chunks.map(chunk => (
						<GraphChunk
							key={`${chunk.from}-${chunk.to}`}
							chunk={chunk}
							getChunkData={graphStore.getChunkData}
							attachedMessages={selectedStore.attachedMessages.filter(message =>
								moment(getTimestampAsNumber(message.timestamp)).isBetween(
									moment(chunk.from),
									moment(chunk.to),
								),
							)}
						/>
					))}
				</div>
			</div>
			<div
				style={{
					...rangeSelectorStyles,
					width: windowWidth,
					left: windowWidth,
				}}>
				<select
					name='interval'
					value={graphStore.interval}
					onChange={e => graphStore.setInterval(parseInt(e.target.value) as 15 | 30 | 60)}>
					{graphStore.intervalOptions.map(intervalValue => (
						<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
					))}
				</select>
			</div>
		</div>
	);
}

export default observer(Graph);
