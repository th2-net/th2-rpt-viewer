/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import {
	useDrag,
	useDrop,
} from 'react-dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { createStyleSelector } from '../../helpers/styleCreators';
import Tab, { TabProps, TabForwardedRefs } from './Tab';
import { DraggableListContext } from './DroppableTabList';

export const DraggableItemTypes = {
	TAB: 'tab',
};

export interface TabDraggableItem {
	type: 'tab';
	tabIndex: number;
	tabRef: React.RefObject<HTMLDivElement>;
	windowIndex: number;
}

export interface DraggableTabProps extends TabProps {
	children: React.ReactNode;
	onTabDrop: (
		droppedTabIndex: number,
		droppedTabWindowIndex: number,
		targetTabIndex: number,
		targetWindowIndex: number,
	) => void;
	windowIndex: number;
	tabIndex: number;
	dragItemPayload: unknown;
}

const DraggableTab: React.RefForwardingComponent<TabForwardedRefs, DraggableTabProps> = (
	props, ref,
) => {
	const {
		tabIndex = 0,
		windowIndex = 0,
		children,
		onTabDrop,
		isSelected,
		classNames = {},
		dragItemPayload = {},
		...tabProps
	} = props;

	const rootRef = React.useRef<HTMLDivElement>(null);

	const {
		activeTab,
		setActiveTab,
	} = React.useContext(DraggableListContext);

	const [, draggableTabRef, preview] = useDrag({
		item: {
			tabIndex,
			windowIndex,
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

	const [{ canDropOnLeft, canDropOnRight, didDrop }, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		drop: (item: TabDraggableItem, monitor) => {
			const clientOffset = monitor.getClientOffset();
			if (!rootRef.current || !clientOffset) return;

			const { left, width } = rootRef.current.getBoundingClientRect();
			const hoverMiddleX = left + width / 2;
			const newTabIndex = clientOffset.x > hoverMiddleX ? tabIndex + 1 : tabIndex;
			if (canDropOnLeft || canDropOnRight) {
				onTabDrop(item.windowIndex, windowIndex, item.tabIndex, newTabIndex);
			}
			setActiveTab(null);
		},
		collect: monitor => {
			const tab = monitor.getItem();
			const isOver = tab && monitor.isOver();
			const dropped = monitor.didDrop();
			const isSameTab = tab && tabIndex === tab.tabIndex;
			const isSameWindow = tab && tab.windowIndex === windowIndex;
			const isDroppableOnLeft = (!isSameWindow && isOver) || (isOver && !isSameTab
				&& tab.tabIndex + 1 !== tabIndex && !dropped);
			const isDroppableOnRight = (!isSameWindow && isOver) || (
				isOver && !isSameTab && tab.tabIndex !== tabIndex + 1 && !dropped
			) || (!!activeTab && (tabIndex + 1 === activeTab.index) && activeTab.canDropOnLeft);

			if (isOver) {
				setActiveTab({
					index: tabIndex,
					windowIndex,
					canDropOnLeft: isDroppableOnLeft,
					canDropOnRight: isDroppableOnRight,
				});
			}
			return {
				canDropOnLeft: isDroppableOnLeft,
				canDropOnRight: isDroppableOnRight,
				isOver,
				didDrop: dropped,
			};
		},
	});

	const rootClassName = createStyleSelector(
		'tab-root',
		isSelected ? 'selected' : null,
		classNames.root || null,
	);

	return (
		<div
			ref={drop}
			className={rootClassName}>
			<DropTargetHint
				show={canDropOnLeft && tabIndex === 0}
				style={{ position: 'relative', left: '-3.5px' }}/>
			<div ref={rootRef} className="tab-root__droppable">
				<div className="tab-root__draggable" ref={draggableTabRef}>
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
				show={(canDropOnRight && activeTab !== null)
					|| (!didDrop && activeTab !== null
						&& (tabIndex + 1 === activeTab.index && activeTab.windowIndex === windowIndex)
					&& activeTab.canDropOnLeft)}
				style={{ position: 'relative', left: '3.5px' }} />
		</div>
	);
};

export default observer(DraggableTab, { forwardRef: true });


interface DropTargetHintProps {
	show: boolean;
	style?: React.CSSProperties;
}

const DropTargetHint = (props: DropTargetHintProps) => {
	const {
		show = false,
		style = {},
	} = props;

	return (
		<AnimatePresence>
			{show && (
				<motion.div
					className="tabs-drop-hint"
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
