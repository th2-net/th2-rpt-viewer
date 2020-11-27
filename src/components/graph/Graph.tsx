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
import GraphChunk from './GraphChunk';
import { useGraphStore } from '../../hooks/useGraphStore';
import { getTimestampAsNumber } from '../../helpers/date';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { IntervalOption } from '../../stores/GraphStore';
import { EventMessage } from '../../models/EventMessage';
import '../../styles/graph.scss';

const getChunkWidth = () => window.innerWidth / 2;

const settings: Settings = {
	itemWidth: getChunkWidth(),
	amount: 3,
	tolerance: 1,
	minIndex: -150,
	maxIndex: 150,
	startIndex: -1,
};

export const rangeSelectorStyles: React.CSSProperties = {
	height: '100%',
	borderLeft: '3px solid #FF7733',
	borderRight: '3px solid #FF7733',
	position: 'absolute',
	top: 0,
	width: getChunkWidth(),
	left: '50%',
	transform: 'translate(-50%)',
	zIndex: 2,
};

function Graph() {
	const graphStore = useGraphStore();
	const selectedStore = useSelectedStore();

	const [acnhorTimestamp, setAnchorTimestamp] = React.useState(graphStore.timestamp);
	const [chunkWidth, setChunkWidth] = React.useState(getChunkWidth);
	const [inputState, setInputState] = React.useState(graphStore.timestamp);

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

	const renderChunk = (index: number) => {
		const chunk = graphStore.getChunkByTimestamp(
			moment(acnhorTimestamp)
				.subtract(-index * graphStore.interval, 'minutes')
				.valueOf(),
		);

		return (
			<div
				ref={rootRef}
				data-from={moment(chunk.from).startOf('minute').valueOf()}
				data-to={moment(chunk.to).endOf('minute').valueOf()}
				className='graph__chunk-item'
				key={index}
				style={{ width: chunkWidth }}>
				<GraphChunk
					key={`${chunk.from}-${chunk.to}`}
					chunk={chunk}
					chunkWidth={chunkWidth}
					getChunkData={graphStore.getChunkData}
					attachedItems={getAttachedMessages(graphStore.timestamp)}
					// attachedItems={selectedStore.attachedMessages.filter(message =>
					// 	moment(getTimestampAsNumber(message.timestamp)).isBetween(
					// 		moment(chunk.from),
					// 		moment(chunk.to),
					// 	),
					// )}
				/>
			</div>
		);
	};

	// 	<div style={rangeSelectorStyles}>
	// 	<select
	// 		name='interval'
	// 		value={graphStore.interval}
	// 		onChange={e => graphStore.setInterval(parseInt(e.target.value) as IntervalOption)}>
	// 		{graphStore.intervalOptions.map(intervalValue => (
	// 			<option key={intervalValue} value={intervalValue}>{`${intervalValue} minutes`}</option>
	// 		))}
	// 	</select>
	// </div>

	const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (new Date(parseInt(e.target.value)).valueOf() > 1) {
			graphStore.setTimestamp(parseInt(e.target.value));
			setInputState(parseInt(e.target.value));
		}
	};

	return (
		<div className='graph'>
			<GraphChunksVirtualizer chunkWidth={chunkWidth} settings={settings} row={renderChunk} />
			<OverlayPanel chunkWidth={chunkWidth} range={graphStore.range} />
		</div>
	);
}

export default observer(Graph);

interface OverlayPanelProps {
	chunkWidth: number;
	range: [number, number];
}

const OverlayPanel = ({ chunkWidth, range: [from, to] }: OverlayPanelProps) => (
	<>
		<div className='graph-overlay left' style={{ width: chunkWidth / 2 }} />
		<div className='graph-overlay right' style={{ width: (window.innerWidth - chunkWidth) / 2 }} />
		<div className='graph-overlay__section' style={{ width: chunkWidth / 2 }}>
			<i className='graph-overlay__logo' />
			<Timestamp timestamp={from} styles={{ right: 0 }} />
		</div>
		<div style={rangeSelectorStyles} />
		<div
			className='graph-overlay__section right'
			style={{ width: (window.innerWidth - chunkWidth) / 2 }}>
			<Timestamp
				timestamp={to}
				styles={{
					transform: 'translate(15%, 5px);',
					textAlign: 'left',
					left: 20,
				}}
			/>
			<div className='graph__search-button' />
			<div className='graph__settings-button' />
		</div>
	</>
);

interface TimestampProps {
	timestamp: number;
	styles?: React.CSSProperties;
}

const Timestamp = ({ timestamp, styles = {} }: TimestampProps) => (
	<div
		className='graph-timestamp'
		style={{
			...styles,
		}}>
		{moment(timestamp).format('DD.MM.YYYY')} <br />
		{moment(timestamp).format('HH:mm:ss.SSS')}
	</div>
);

const getAttachedMessages = (timestamp: number): EventMessage[] => [
	{
		body: {
			fields: {
				asd: {
					listValue: {
						values: [],
					},
				},
			},
			metadata: {
				id: {
					connectionId: {
						sessionAlias: '',
					},
					sequence: '',
				},
				messageType: '',
				timestamp: new Date().toString(),
			},
		},
		bodyBase64: '',
		direction: '',
		messageId: 'e234sdf-32423-ssfsdf-46446-h342gs',
		messageType: '',
		sessionId: '',
		type: '',
		timestamp: {
			epochSecond: moment(timestamp).add(10, 'minute').valueOf() / 1000,
			nano: 0,
		},
	},
	{
		body: {
			fields: {
				asd: {
					listValue: {
						values: [],
					},
				},
			},
			metadata: {
				id: {
					connectionId: {
						sessionAlias: '',
					},
					sequence: '',
				},
				messageType: '',
				timestamp: new Date().toString(),
			},
		},
		bodyBase64: '',
		direction: '',
		messageId: 'e234sdf-32423-sdfsdf-46346-h342gs',
		messageType: '',
		sessionId: '',
		type: '',
		timestamp: {
			epochSecond: moment(timestamp).add(10, 'minute').valueOf() / 1000,
			nano: 0,
		},
	},
];
