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
import { observer } from 'mobx-react-lite';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { motion } from 'framer-motion';
import { createStyleSelector } from '../../helpers/styleCreators';
import Tab, { TabProps, TabForwardedRefs } from './Tab';

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

	const [{ canDropOnLeft, canDropOnRight }, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		drop: (item: TabDraggableItem) => {
			onTabDrop(item.windowIndex, windowIndex, item.tabIndex, tabIndex);
		},
		collect: monitor => {
			const tab = monitor.getItem();
			const didDrop = monitor.didDrop();
			const isDroppableOnLeft = tab && !didDrop
				&& (tabIndex === 0 && tab.tabIndex !== tabIndex && windowIndex !== tab.windowIndex);
			const isDroppableOnRight = tab && !didDrop && ((tab.windowIndex !== windowIndex)
				|| (tab.tabIndex !== tabIndex && (tab.tabIndex !== tabIndex + 1)));
			return {
				canDropOnLeft: isDroppableOnLeft,
				canDropOnRight: isDroppableOnRight,
			};
		},
	});

	const rootClassName = createStyleSelector(
		'tab-root',
		isSelected ? 'selected' : null,
		classNames.root || null,
	);

	return (
		<div ref={rootRef} className={rootClassName}>
			<div ref={drop} className="tab-root__droppable">
				<DropHint
					show={canDropOnLeft}
					style={{
						position: 'relative',
						left: -3.5,
					}}/>
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
				<DropHint
					show={canDropOnRight}
					style={{
						position: 'relative',
						left: 3.5,
					}}/>
			</div>
		</div>
	);
};

interface DropHintProps {
	show: boolean;
	style?: React.CSSProperties;
}

const DropHint = (props: DropHintProps) => {
	const { show, style = {} } = props;
	const rootClassName = createStyleSelector(
		'tabs-drop-hint',
		show ? 'active' : null,
	);
	if (!show) return null;

	return (
		<motion.div
			className={rootClassName}
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			style={style}
			transition={{
			  type: 'spring',
			  stiffness: 260,
			  damping: 20,
			}}/>
	);
};

export default observer(DraggableTab, { forwardRef: true });
