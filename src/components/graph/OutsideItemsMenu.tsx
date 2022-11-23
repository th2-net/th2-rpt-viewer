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
import { AnimatePresence, motion } from 'framer-motion';
import GraphItemsMenu from './GraphItemsMenu';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { GraphItem, GraphItemType } from '../../models/Graph';
import { getEventStatus, isEventNode } from '../../helpers/event';
import { EventStatus } from '../../models/Status';
import { GraphStore } from '../../stores/GraphStore';
import '../../styles/graph.scss';

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

export interface OutsideItems {
	left: GraphItem[];
	right: GraphItem[];
}

export interface OutsideCenters {
	left: {
		'events-panel': boolean;
		'messages-panel': boolean;
	};
	right: {
		'events-panel': boolean;
		'messages-panel': boolean;
	};
}

interface OutsideItemsMenuProps extends Omit<OutsideItemsListProps, 'itemsMap'> {
	items: GraphItem[];
	direction: 'left' | 'right';
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
}

export function OutsideItemsMenu(props: OutsideItemsMenuProps) {
	const { items, direction, onGraphItemClick, getGraphItemType, ...listProps } = props;

	const rootRef = React.useRef<HTMLDivElement>(null);
	const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

	function openMenu() {
		setMenuAnchor(rootRef.current);
	}

	const outsideItemsMap = React.useMemo(() => {
		const map: Partial<Record<EventStatus | GraphItemType, number>> = {};

		items.forEach(item => {
			let key: EventStatus | GraphItemType;
			if (isEventNode(item)) {
				key = getEventStatus(item);
			} else {
				key = getGraphItemType(item);
			}
			map[key] = (map[key] || 0) + 1;
		});

		return map;
	}, [items]);

	return (
		<>
			<OutsideItemsList
				{...listProps}
				ref={rootRef}
				onClick={openMenu}
				itemsMap={outsideItemsMap}
				direction={direction}
			/>
			<GraphItemsMenu
				isMenuOpened={Boolean(menuAnchor)}
				getGraphItemType={getGraphItemType}
				items={items}
				onClose={() => setMenuAnchor(null)}
				onMenuItemClick={onGraphItemClick}
				anchorEl={menuAnchor}
			/>
		</>
	);
}

interface OutsideItemsListProps {
	itemsMap: Record<string, number | undefined>;
	direction: 'left' | 'right';
	onClick?: () => void;
	onItemClick?: (key: string) => void;
	onArrowClick?: (direction: 'left' | 'right') => void;
	className?: string;
	showCount?: boolean;
	// pretty sure showPanels has to stay as an optional prop, because we don't use it with bookmarks
	showPanels?: OutsideCenters;
}

export const OutsideItemsList = React.forwardRef<HTMLDivElement, OutsideItemsListProps>(
	(
		{
			itemsMap = {},
			direction,
			onClick,
			className = '',
			showCount = true,
			showPanels = {
				left: {
					'events-panel': false,
					'messages-panel': false,
				},
				right: {
					'events-panel': false,
					'messages-panel': false,
				},
			},
			onItemClick,
			onArrowClick,
		}: OutsideItemsListProps,
		ref,
	) => {
		const isPanel = (value: string): value is 'events-panel' | 'messages-panel' => {
			switch (value) {
				case 'events-panel':
				case 'messages-panel':
					return true;
				default:
					return false;
			}
		};
		return (
			<AnimatePresence>
				{Object.values(itemsMap).some(Boolean) && (
					<motion.div
						variants={direction === 'left' ? leftIndicatorVariants : rightIndicatorVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						className={`outside-items__indicator ${direction} ${className}`}
						ref={ref}>
						<i
							className={`outside-items__indicator-pointer ${direction}`}
							onClick={e => {
								if (onArrowClick) {
									e.stopPropagation();
									onArrowClick(direction);
								}
							}}
						/>
						{/* maybe this could be done better with motion.div */}
						<div className='outside-items__wrapper' onClick={onClick}>
							{Object.entries(itemsMap)
								.filter(item => Boolean(item[1]))
								.map(([type, count]) => {
									const lowercaseType = type.toLowerCase();
									if (type && isPanel(lowercaseType)) {
										if (!showPanels[direction][lowercaseType]) {
											return null;
										}
									}
									return (
										<div
											key={type}
											className={`outside-items__indicator-item ${direction}`}
											onClick={e => {
												if (onItemClick) {
													e.stopPropagation();
													onItemClick(type);
												}
											}}>
											<i className={`outside-items__indicator-icon ${type.toLowerCase()}`} />
											{showCount && (
												<span className='outside-items__indicator-value'>{`+ ${count}`}</span>
											)}
										</div>
									);
								})}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		);
	},
);

OutsideItemsList.displayName = 'OutsideItemsList';
