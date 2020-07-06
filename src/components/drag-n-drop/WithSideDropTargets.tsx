/** *****************************************************************************
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

import * as React from 'react';
import { useDrop } from 'react-dnd';
import { DraggableItemTypes, TabDraggableItem } from '../tabs/DraggableTab';
import { isEqual } from '../../helpers/object';
import SideDropTarget from './SideDropTarget';
import '../../styles/dragndrop.scss';

interface WithSideDropTargetsProps {
	children?: React.ReactNode;
	offsetTop?: number;
	droppableAreaPercent?: number;
	leftDropAreaEnabled?: boolean;
	rightDropAreaEnabled?: boolean;
	onDropLeft: (draggedTab: TabDraggableItem) => void;
	onDropRight: (draggedTab: TabDraggableItem) => void;
}

const defaultHoverState = Object.freeze({
	isOverContent: false,
	isOverLeftSide: false,
	isOverRightSide: false,
	canDropOnLeft: false,
	canDropOnRight: false,
	yCoord: 0,
});

export const WithSideDropTargetsBase = (props: WithSideDropTargetsProps) => {
	const {
		children,
		offsetTop = 0,
		droppableAreaPercent = 15,
		onDropLeft,
		onDropRight,
		rightDropAreaEnabled = true,
		leftDropAreaEnabled = true,
	} = props;
	const [hoverState, setHoverState] = React.useState(defaultHoverState);

	const rootRef = React.useRef<HTMLDivElement>(null);

	const [, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		drop: (item: TabDraggableItem) => {
			if (hoverState.canDropOnLeft && leftDropAreaEnabled) {
				onDropLeft(item);
			}
			if (hoverState.canDropOnRight && rightDropAreaEnabled) {
				onDropRight(item);
			}
			setHoverState(defaultHoverState);
		},
		hover: (item, monitor) => {
			const clientXY = monitor.getClientOffset();
			const root = rootRef.current;
			if (!clientXY || !root) return;
			const {
				top,
				bottom,
				left,
				right,
				width,
			} = root.getBoundingClientRect();

			const isOverContent = clientXY.y >= (top + offsetTop) && clientXY.y <= bottom;
			const isOverLeftSide = isOverContent && clientXY.x >= left && clientXY.x <= (left + width / 2);
			const isOverRightSide = isOverContent && !isOverLeftSide;
			const droppableAreaWidth = left + (droppableAreaPercent / 100) * width;
			const canDropOnLeft = isOverLeftSide && clientXY.x <= left + droppableAreaWidth;
			const canDropOnRight = isOverRightSide && (clientXY.x > right - droppableAreaWidth);

			if (!isOverContent) {
				setHoverState(defaultHoverState);
				return;
			}
			const updatedHoverState = {
				isOverContent,
				isOverLeftSide,
				isOverRightSide,
				canDropOnLeft,
				canDropOnRight,
				yCoord: clientXY.y,
			};

			if (!isEqual(hoverState, updatedHoverState)) {
				setHoverState(updatedHoverState);
			}
		},
	});

	return (
		<div ref={rootRef} className="with-side-drop-target__root">
			<div
				ref={drop}
				className="with-side-drop-target"
				onMouseLeave={() => setHoverState(defaultHoverState)}>
				<SideDropTarget
					canDrop={hoverState.canDropOnLeft}
					yCoord={hoverState.yCoord}
					style={{ left: 0, right: undefined }}/>
				{children}
				<SideDropTarget
					canDrop={hoverState.canDropOnRight}
					yCoord={hoverState.yCoord}/>
			</div>
		</div>
	);
};

export const withSideDropTarget = <P extends object>(
	Component: React.ComponentType<P>,
): React.FC<P & WithSideDropTargetsProps> => (props: WithSideDropTargetsProps & P) => {
		const {
			leftDropAreaEnabled,
			rightDropAreaEnabled,
			onDropLeft,
			onDropRight,
			droppableAreaPercent,
			offsetTop,
			...restProps
		} = props;

		if (!leftDropAreaEnabled && !rightDropAreaEnabled) return <Component {...restProps as P} />;

		return (
			<WithSideDropTargetsBase
				leftDropAreaEnabled={leftDropAreaEnabled}
				rightDropAreaEnabled={rightDropAreaEnabled}
				onDropLeft={onDropLeft}
				onDropRight={onDropRight}
				droppableAreaPercent={droppableAreaPercent}
				offsetTop={offsetTop}
			>
				<Component {...restProps as P}/>
			</WithSideDropTargetsBase>
		);
	};
