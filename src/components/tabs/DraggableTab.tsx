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
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { AnimatePresence, motion } from 'framer-motion';
import throttle from 'lodash.throttle';
import { observer } from 'mobx-react-lite';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { createStyleSelector } from '../../helpers/styleCreators';
import Tab, { TabProps } from './Tab';
import { DraggableTabListContext } from './DroppableTabList';

export const DraggableItemTypes = {
	TAB: 'tab',
};

export interface TabDraggableItem {
	type: 'tab';
	tabIndex: number;
	tabRef: React.RefObject<HTMLDivElement>;
}

export interface DraggableTabProps extends TabProps {
	children: React.ReactNode;
	onTabDrop: (droppedTabIndex: number, targetTabIndex: number) => void;
	tabIndex: number;
	dragItemPayload: unknown;
	style?: React.CSSProperties;
	tabCount: number;
}

const DraggableTab: React.RefForwardingComponent<HTMLDivElement, DraggableTabProps> = (
	props,
	ref,
) => {
	const {
		tabIndex = 0,
		children,
		onTabDrop,
		isSelected,
		classNames = {},
		dragItemPayload = {},
		style = {},
		tabCount,
		...tabProps
	} = props;

	const rootRef = React.useRef<HTMLDivElement>(null);

	const { activeTab, setActiveTab, setIsDragging } = React.useContext(DraggableTabListContext);

	const [{ isDragging }, draggableTabRef, preview] = useDrag({
		item: {
			tabIndex,
			type: DraggableItemTypes.TAB,
			tabRef: rootRef,
			payload: dragItemPayload,
		},
		collect: monitor => ({
			isDragging: monitor.isDragging(),
		}),
	});

	React.useEffect(() => {
		preview(getEmptyImage(), { captureDraggingState: true });
	}, [preview]);

	const getDraggingState = (item: TabDraggableItem, monitor: DropTargetMonitor) => {
		const { left = 0, width = 0 } = rootRef.current?.getBoundingClientRect() || {};
		const tabMiddleX = left + width / 2;
		const clientOffset = monitor.getClientOffset();

		const tab = monitor.getItem();
		const isOver = tab && monitor.isOver();
		const didDrop = monitor.didDrop();
		const isSameTab = tab && tabIndex === tab.tabIndex;
		const isNextTab = tab && tabIndex === tab.tabIndex + 1;

		const hoveredLeft = (clientOffset?.x || 0) < tabMiddleX;
		const hoveredRight = (clientOffset?.x || 0) >= tabMiddleX;

		const isDroppableOnLeft = isOver && !didDrop && hoveredLeft && !isSameTab && !isNextTab;

		const isDroppableOnRight =
			isOver &&
			!didDrop &&
			(hoveredRight || (!isSameTab && tab.tabIndex !== tabIndex + 1 && hoveredRight));

		const newActiveTabState = {
			index: tabIndex,
			canDropOnLeft: isDroppableOnLeft,
			canDropOnRight: isDroppableOnRight,
		};

		if (isOver) {
			setActiveTab(newActiveTabState);
		}
	};

	const throttledGetDraggingState = React.useRef(throttle(getDraggingState, 50)).current;

	const [{ didDrop }, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		drop: (item: TabDraggableItem) => {
			if (activeTab && (activeTab.canDropOnLeft || activeTab.canDropOnRight)) {
				const newTabIndex = activeTab.canDropOnRight ? tabIndex + 1 : tabIndex;
				onTabDrop(item.tabIndex, newTabIndex);
			}

			setActiveTab(null);
			setIsDragging(false);
		},
		hover: throttledGetDraggingState,
		collect: monitor => ({
			didDrop: monitor.didDrop(),
		}),
	});

	React.useEffect(() => {
		if (isDragging) setIsDragging(true);
		if (didDrop) setIsDragging(false);
	}, [isDragging, didDrop]);

	const rootClassName = createStyleSelector(
		'tab-root',
		isSelected ? 'selected' : null,
		classNames.root || null,
	);

	return (
		<div ref={drop} className={rootClassName} style={style}>
			<DropTargetHint
				show={
					activeTab !== null && activeTab.index === 0 && tabIndex === 0 && activeTab.canDropOnLeft
				}
				style={{
					marginRight: '4px',
					height: 36,
				}}
			/>
			<div ref={rootRef} className='tab-root__droppable'>
				<div className='tab-root__draggable' ref={draggableTabRef}>
					<Tab
						ref={ref}
						tabIndex={tabIndex}
						isSelected={isSelected}
						classNames={classNames}
						{...tabProps}>
						{children}
					</Tab>
				</div>
			</div>
			<DropTargetHint
				show={
					activeTab !== null &&
					((activeTab.index === tabIndex && activeTab.canDropOnRight) ||
						(activeTab.index === tabIndex + 1 && activeTab.canDropOnLeft))
				}
				style={{
					position: 'relative',
					left: tabCount === tabIndex + 1 ? 0 : '3.5px',
					height: 36,
					marginLeft: tabCount === tabIndex + 1 ? '4px' : '0',
				}}
			/>
		</div>
	);
};

export default observer(DraggableTab, { forwardRef: true });

interface DropTargetHintProps {
	show: boolean;
	style?: React.CSSProperties;
}

const DropTargetHint = (props: DropTargetHintProps) => {
	const { show = false, style = {} } = props;

	return (
		<AnimatePresence>
			{show && (
				<motion.div
					className='tabs-drop-hint'
					style={style}
					initial={{ width: 0, opacity: 0, scale: 0 }}
					animate={{ width: 10, opacity: 1, scale: 1 }}
					exit={{ width: 0, opacity: 0, scale: 0 }}
					transition={{
						type: 'spring',
						stiffness: 260,
						damping: 60,
					}}>
					<div />
				</motion.div>
			)}
		</AnimatePresence>
	);
};
