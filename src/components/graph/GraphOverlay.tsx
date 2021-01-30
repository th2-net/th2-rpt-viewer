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

import React from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { AnimatePresence, motion } from 'framer-motion';
import GraphItemsMenu from './GraphItemsMenu';
import { useActiveWorkspace, useSelectedStore } from '../../hooks';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { AttachedItem, OutsideItems } from '../../models/Graph';
import TimestampInput from '../util/TimestampInput';
import { isEventNode } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import '../../styles/graph.scss';

interface OverlayPanelProps {
	chunkWidth: number;
	range: TimeRange;
	onInputSubmit: (timestamp: number) => void;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
}

const GraphOverlay = (props: OverlayPanelProps) => {
	const {
		chunkWidth,
		range: [from, to],
		onInputSubmit,
		onGraphItemClick,
	} = props;

	const selectedStore = useSelectedStore();
	const activeWorkspace = useActiveWorkspace();

	const overlayWidth = (window.innerWidth - chunkWidth) / 2;
	const commonStyles: React.CSSProperties = { width: overlayWidth };

	const intervalValues = React.useMemo(() => {
		return activeWorkspace.graphDataStore.getIntervalData();
	}, [from]);

	const outsideItems = React.useMemo(() => {
		return activeWorkspace.graphDataStore.getOverlayValues();
	}, [
		from,
		selectedStore.attachedMessages,
		selectedStore.pinnedMessages,
		selectedStore.pinnedEvents,
	]);

	return (
		<>
			<div className='graph-overlay left' style={commonStyles} />
			<div className='graph-overlay right' style={commonStyles} />
			<div className='graph-overlay__section' style={commonStyles}>
				<i className='graph-overlay__logo' />
				<Timestamp className='from' timestamp={from} />
				<OutsideItemsMenu
					onGraphItemClick={onGraphItemClick}
					direction='left'
					items={outsideItems.left}
				/>
			</div>
			<div className='graph-overlay__section right' style={commonStyles}>
				<OutsideItemsMenu
					onGraphItemClick={onGraphItemClick}
					direction='right'
					items={outsideItems.right}
				/>
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
								<span className='graph__pinned-messages-counter-value'>
									{`${selectedStore.pinnedMessages.length} saved`}
								</span>
							</motion.button>
						)}
					</AnimatePresence>
					<div className='graph__search-button' />
					<div className='graph__settings-button' />
				</div>
			</div>
			<div className='graph-range-selector__border left' style={{ left: overlayWidth }} />
			<div
				className='graph-range-selector__border right'
				style={{ left: overlayWidth + chunkWidth }}
			/>
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

function Timestamp({ timestamp, className = '' }: TimestampProps) {
	return (
		<div className={`graph-timestamp ${className}`}>
			{moment(timestamp).utc().format('DD.MM.YYYY')} <br />
			{moment(timestamp).utc().format('HH:mm:ss.SSS')}
		</div>
	);
}

export default observer(GraphOverlay);

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

interface OutsideItemsProps {
	items: OutsideItems;
	direction: 'left' | 'right';
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
}

function OutsideItemsMenu(props: OutsideItemsProps) {
	const { items, direction, onGraphItemClick } = props;

	const rootRef = React.useRef<HTMLDivElement>(null);
	const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

	function openMenu() {
		setMenuAnchor(rootRef.current);
	}

	const menuItems: AttachedItem[] = React.useMemo(() => {
		return Object.values(items)
			.flat()
			.map(item => {
				return {
					value: item,
					type: isEventNode(item) ? 'event' : 'pinned-message',
				};
			});
	}, [items]);

	return (
		<>
			<AnimatePresence>
				{Object.values(items).some(value => value.length !== 0) && (
					<motion.div
						variants={direction === 'left' ? leftIndicatorVariants : rightIndicatorVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						className={`outside-items-indicator ${direction}`}
						ref={rootRef}
						onClick={openMenu}>
						<i className={`outside-items-indicator-pointer ${direction}`} />
						<div className='outside-items-wrapper'>
							{Object.entries(items)
								.filter(([_, value]) => value.length)
								.map(([key, value]) => (
									<div key={key} className={`outside-items-indicator-item ${direction}`}>
										<i className={`outside-items-indicator-icon ${key}`} />
										<span className='outside-items-indicator-value'>{`+ ${value.length}`}</span>
									</div>
								))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<GraphItemsMenu
				isMenuOpened={Boolean(menuAnchor)}
				items={menuItems}
				onClose={() => setMenuAnchor(null)}
				onMenuItemClick={onGraphItemClick}
				anchorEl={menuAnchor}
			/>
		</>
	);
}
