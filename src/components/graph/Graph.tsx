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

/* eslint-disable max-len */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { AnimatePresence, motion } from 'framer-motion';
import ResizeObserver from 'resize-observer-polyfill';
import GraphChunk, { AttachedItem } from './GraphChunk';
import { useActivePanel, useGraphStore, useSelectedStore, useWorkspaces } from '../../hooks';
import GraphChunksVirtualizer, { Settings } from './GraphChunksVirtualizer';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { Chunk, OutsideItems } from '../../models/graph';
import { filterListByChunkRange } from '../../helpers/graph';
import TimestampInput from '../util/TimestampInput';
import { isEventAction, isEventMessage, mapToTimestamps, getTimestamp } from '../../helpers/event';
import { isMessagesStore } from '../../helpers/stores';
import { getTimestampAsNumber } from '../../helpers/date';
import '../../styles/graph.scss';

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
	const workspacesStore = useWorkspaces();
	const { ref: rootRef } = useActivePanel();

	const [chunkWidth, setChunkWidth] = React.useState(getChunkWidth);

	const [expandedAttachedItem, setExpandedAttachedItem] = React.useState<
		EventAction | EventMessage | null
	>(null);

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
		const attachedItems: AttachedItem[] = filterListByChunkRange(chunk, [
			...selectedStore.pinnedEvents,
			...selectedStore.attachedMessages,
			...selectedStore.pinnedMessages,
		]).map(item => ({
			value: item,
			type: isEventAction(item)
				? 'event'
				: selectedStore.attachedMessages.includes(item)
				? 'attached-message'
				: 'pinned-message',
		}));

		return (
			<div
				data-from={moment(chunk.from).startOf('minute').valueOf()}
				data-to={moment(chunk.to).endOf('minute').valueOf()}
				className='graph__chunk-item'
				data-index={index}
				key={`${chunk.from}-${chunk.to}`}
				style={{ width: chunkWidth }}>
				<GraphChunk
					tickSize={graphStore.tickSize}
					interval={graphStore.interval}
					chunk={chunk}
					chunkWidth={chunkWidth}
					getChunkData={graphStore.getChunkData}
					attachedItems={attachedItems}
					expandedAttachedItem={expandedAttachedItem}
					setExpandedAttachedItem={onGraphItemClick}
				/>
			</div>
		);
	};

	const onGraphItemClick = (item: EventAction | EventMessage | null) => {
		setExpandedAttachedItem(item);
		if (item !== null) workspacesStore.onSavedItemSelect(item);
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
		<div className='graph'>
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

const fadeInOutVariants = {
	visible: {
		opacity: 1,
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
	hidden: {
		opacity: 0,
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
};

const rightIndicatorVariants = {
	visible: {
		opacity: 1,
		right: '14px',
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
	hidden: {
		opacity: 0,
		right: '-14px',
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
};

const leftIndicatorVariants = {
	visible: {
		opacity: 1,
		left: '14px',
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
	hidden: {
		opacity: 0,
		left: '-14px',
		transition: {
			duration: 0.15,
			type: 'tween',
		},
	},
};

interface OverlayPanelProps {
	chunkWidth: number;
	range: [number, number];
	onInputSubmit: (timestamp: number) => void;
}

const OverlayPanels = observer(
	({ chunkWidth, range: [from, to], onInputSubmit }: OverlayPanelProps) => {
		const graphStore = useGraphStore();
		const selectedStore = useSelectedStore();
		const workspaceStore = useWorkspaces().activeWorkspace;

		const overlayWidth = (window.innerWidth - chunkWidth) / 2;
		const commonStyles: React.CSSProperties = { width: overlayWidth };

		const intervalValues = React.useMemo(() => {
			return graphStore.getIntervalData();
		}, [from]);

		const outsideItems = React.useMemo(() => {
			return graphStore.getOverlayValues();
		}, [
			from,
			selectedStore.attachedMessages,
			selectedStore.pinnedMessages,
			selectedStore.pinnedEvents,
		]);

		const handleIndicatorPointerClick = (direction: 'left' | 'right') => {
			const items = Object.values(direction === 'left' ? outsideItems.left : outsideItems.right)
				.flatMap(groupItems => groupItems)
				.sort((first, second) => {
					const firstTimestamp = getTimestampAsNumber(getTimestamp(first));
					const secondTimestamp = getTimestampAsNumber(getTimestamp(second));
					return firstTimestamp > secondTimestamp ? 1 : -1;
				});
			const timestamps = items.map(item => getTimestampAsNumber(getTimestamp(item)));
			const targetItem = items[direction === 'left' ? timestamps.length - 1 : 0];

			if (isEventMessage(targetItem) && isMessagesStore(workspaceStore.viewStore.activePanel)) {
				workspaceStore.setAttachedMessagesIds([targetItem.messageId]);
			}
			graphStore.setTimestamp(timestamps[direction === 'left' ? timestamps.length - 1 : 0]);
		};

		const handleIdicatorItemClick = (group: keyof OutsideItems, direction: 'left' | 'right') => {
			const items = outsideItems[direction][group].sort(
				(first: EventAction | EventMessage, second: EventAction | EventMessage) => {
					const firstTimestamp = getTimestampAsNumber(getTimestamp(first));
					const secondTimestamp = getTimestampAsNumber(getTimestamp(second));
					return firstTimestamp > secondTimestamp ? 1 : -1;
				},
			);
			const timestamps = mapToTimestamps(items);
			const targetItem = items[direction === 'left' ? timestamps.length - 1 : 0];

			if (isEventMessage(targetItem) && isMessagesStore(workspaceStore.viewStore.activePanel)) {
				workspaceStore.setAttachedMessagesIds([targetItem.messageId]);
			}
			graphStore.setTimestamp(timestamps[direction === 'left' ? timestamps.length - 1 : 0]);
		};

		return (
			<>
				<div className='graph-overlay left' style={commonStyles} />
				<div className='graph-overlay right' style={commonStyles} />
				<div className='graph-overlay__section' style={commonStyles}>
					<i className='graph-overlay__logo' />
					<Timestamp className='from' timestamp={from} />
					<AnimatePresence>
						{Object.values(outsideItems.left).some(value => value.length !== 0) && (
							<motion.div
								variants={leftIndicatorVariants}
								initial='hidden'
								animate='visible'
								exit='hidden'
								className='graph__outside-items-indicator left'>
								<i
									onClick={() => handleIndicatorPointerClick('left')}
									className='graph__outside-items-indicator-pointer left'
								/>
								<div className='graph__outside-items-wrapper'>
									{Object.entries(outsideItems.left)
										.filter(([_, value]) => value.length)
										.map(([key, value]) => (
											<div
												key={key}
												onClick={() => handleIdicatorItemClick(key as keyof OutsideItems, 'left')}
												className='graph__outside-items-indicator-item'>
												<i className={`graph__outside-items-indicator-icon ${key}`} />
												<span className='graph__outside-items-indicator-value'>
													{`+ ${value.length}`}
												</span>
											</div>
										))}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
				<div className='graph-overlay__section right' style={commonStyles}>
					<Timestamp className='to' timestamp={to} />
					<div className='graph-overlay__wrapper'>
						<AnimatePresence>
							{selectedStore.pinnedMessages.length > 0 && (
								<motion.button
									variants={fadeInOutVariants}
									initial='hidden'
									animate='visible'
									exit='hidden'
									className='graph__pinned-messages-counter'>
									<i className='graph__pinned-messages-counter-icon' />
									<span className='graph__pinned-messages-counter-value'>{`${selectedStore.pinnedMessages.length} saved`}</span>
								</motion.button>
							)}
						</AnimatePresence>
						<div className='graph__search-button' />
						<div className='graph__settings-button' />
						<AnimatePresence>
							{Object.values(outsideItems.right).some(value => value.length !== 0) && (
								<motion.div
									variants={rightIndicatorVariants}
									initial='hidden'
									animate='visible'
									exit='hidden'
									className='graph__outside-items-indicator right'>
									<div className='graph__outside-items-wrapper'>
										{Object.entries(outsideItems.right)
											.filter(([_, value]) => value.length)
											.map(([key, value]) => (
												<div
													key={key}
													onClick={() =>
														handleIdicatorItemClick(key as keyof OutsideItems, 'right')
													}
													className='graph__outside-items-indicator-item'>
													<span className='graph__outside-items-indicator-value'>
														{`+ ${value.length}`}
													</span>
													<i className={`graph__outside-items-indicator-icon ${key}`} />
												</div>
											))}
									</div>
									<i
										onClick={() => handleIndicatorPointerClick('right')}
										className='graph__outside-items-indicator-pointer right'
									/>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
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
	},
);
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
