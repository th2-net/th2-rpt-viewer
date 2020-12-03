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
import ResizeObserver from 'resize-observer-polyfill';
import GraphChunk, { AttachedItem } from './GraphChunk';
import { useGraphStore, useSelectedStore } from '../../hooks';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { Chunk } from '../../models/graph';
import { filterListByChunkRange } from '../../helpers/graph';
import '../../styles/graph.scss';
import TimestampInput from '../util/TimestampInput';

const getChunkWidth = () => window.innerWidth / 2;

const settings: Settings = {
	itemWidth: getChunkWidth(),
	amount: 3,
	tolerance: 1,
	minIndex: -100,
	maxIndex: 100,
	startIndex: 0,
};

function Graph() {
	const graphStore = useGraphStore();
	const selectedStore = useSelectedStore();

	const [chunkWidth, setChunkWidth] = React.useState(getChunkWidth);

	const [expandedAttachedItem, setExpandedAttachedItem] = React.useState<
		EventAction | EventMessage | null
	>(null);

	const rootRef = React.useRef<HTMLDivElement>(null);

	const resizeObserver = React.useRef(
		new ResizeObserver(() => {
			setChunkWidth(getChunkWidth);
		}),
	);

	React.useEffect(() => {
		if (rootRef.current) resizeObserver.current.observe(rootRef.current);

		return () => {
			if (rootRef.current) resizeObserver.current.unobserve(rootRef.current);
		};
	}, []);

	const renderChunk = (chunk: Chunk, index: number) => {
		const attachedItems: AttachedItem[] = filterListByChunkRange(
			chunk,
			selectedStore.attachedMessages.concat(selectedStore.pinnedMessages),
		).map(message => ({
			value: message,
			type: (selectedStore.attachedMessages.includes(message)
				? 'attached-message'
				: 'pinned-message') as 'attached-message' | 'pinned-message' | 'event',
		}));

		return (
			<div
				data-from={moment(chunk.from).startOf('minute').valueOf()}
				data-to={moment(chunk.to).endOf('minute').valueOf()}
				className='graph__chunk-item'
				data-index={index}
				key={index}
				style={{ width: chunkWidth }}>
				<GraphChunk
					tickSize={graphStore.tickSize}
					interval={graphStore.interval}
					key={`${chunk.from}-${chunk.to}`}
					chunk={chunk}
					chunkWidth={chunkWidth}
					getChunkData={graphStore.getChunkData}
					attachedItems={attachedItems}
					expandedAttachedItem={expandedAttachedItem}
					setExpandedAttachedItem={setExpandedAttachedItem}
				/>
			</div>
		);
	};

	// 	<select
	// 		name='interval'
	// 		value={graphStore.interval}
	// 		onChange={e => graphStore.setInterval(parseInt(e.target.value) as IntervalOption)}>
	// 		{graphStore.intervalOptions.map(intervalValue => (
	// 			<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
	// 		))}
	// 	</select>

	const onInputSubmit = (timestamp: number) => {
		if (new Date(timestamp).valueOf() > 1) {
			graphStore.setTimestamp(timestamp);
		}
	};

	return (
		<div className='graph' ref={rootRef}>
			<GraphChunksVirtualizer
				chunkWidth={chunkWidth}
				settings={settings}
				setExpandedAttachedItem={setExpandedAttachedItem}
				renderChunk={renderChunk}
				timestamp={graphStore.timestamp}
				key={graphStore.timestamp}
			/>
			<OverlayPanels
				chunkWidth={chunkWidth}
				range={graphStore.range}
				onInputSubmit={onInputSubmit}
			/>
		</div>
	);
}

export default observer(Graph);

interface OverlayPanelProps {
	chunkWidth: number;
	range: [number, number];
	onInputSubmit: (timestamp: number) => void;
}

const OverlayPanels = ({ chunkWidth, range: [from, to], onInputSubmit }: OverlayPanelProps) => {
	const graphStore = useGraphStore();
	const overlayWidth = (window.innerWidth - chunkWidth) / 2;
	const commonStyles: React.CSSProperties = { width: overlayWidth };
	const intervalValues = React.useMemo(() => {
		return graphStore.getIntervalData();
	}, [from]);

	return (
		<>
			<div className='graph-overlay left' style={commonStyles} />
			<div className='graph-overlay right' style={commonStyles} />
			<div className='graph-overlay__section' style={commonStyles}>
				<i className='graph-overlay__logo' />
				<Timestamp className='from' timestamp={from} />
			</div>
			<div className='graph-overlay__section right' style={commonStyles}>
				<Timestamp className='to' timestamp={to} />
				<div className='graph__search-button' />
				<div className='graph__settings-button' />
			</div>
			<div className='graph-range-selector' style={{ width: chunkWidth, left: overlayWidth }}>
				<div className='graph-range-selector__wrapper'>
					{Object.entries(intervalValues).map(([key, value], index) => (
						<div
							key={key}
							style={{
								order: index,
							}}
							className={`graph-range-selector__counter ${key}`}>
							{['passed', 'failed', 'connected'].includes(key) && (
								<i className='graph-range-selector__counter-icon' />
							)}
							<span className='graph-range-selector__counter-value'>{`${value} ${key}`}</span>
						</div>
					))}
					<TimestampInput
						wrapperClassName='graph-range-selector__timestamp-input timestamp-input'
						onSubmit={onInputSubmit}
					/>
				</div>
			</div>
		</>
	);
};
interface TimestampProps {
	timestamp: number;
	className?: string;
}

const Timestamp = ({ timestamp, className = '' }: TimestampProps) => (
	<div className={`graph-timestamp ${className}`}>
		{moment(timestamp).utc().format('DD.MM.YYYY')} <br />
		{moment(timestamp).utc().format('HH:mm:ss.SSS')}
	</div>
);
