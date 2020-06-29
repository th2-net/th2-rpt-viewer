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
import { motion } from 'framer-motion';
import { DraggableItemTypes, TabDraggableItem } from '../tabs/DraggableTab';
import '../../styles/dragndrop.scss';

interface WindowSideDropTargetProps {
	moveTabToNewWindow: (tabIndex: number) => void;
	children?: React.ReactNode;
}

export const WindowSideDropTarget = ({ moveTabToNewWindow, children }: WindowSideDropTargetProps) => {
	const [yCoord, setYCoord] = React.useState<null | number>(null);

	const [{ isOver }, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		drop: (item: TabDraggableItem, monitor) => {
			const clientXY = monitor.getClientOffset();
			const canDropTab = !!clientXY && (
				clientXY.x >= document.documentElement.clientWidth - 150) && clientXY.y > 50;
			if (canDropTab && isOver) {
				moveTabToNewWindow(item.tabIndex);
			}
			setYCoord(null);
			return item;
		},
		hover: (item, monitor) => {
			const clientXY = monitor.getClientOffset();
			const canDropTab = !!clientXY && (
				clientXY.x >= document.documentElement.clientWidth - 150) && clientXY.y > 50;
			if (!yCoord && canDropTab && clientXY) {
				setYCoord(clientXY.y);
			} else if (!canDropTab) {
				setYCoord(null);
			}
		},
		collect: monitor => ({
			isOver: monitor.isOver(),
		}),
	});
	return (
		<div className="side-drop-target" ref={drop}>
			{children}
			<motion.div
				className="side-drop-target__overlay"
				positionTransition
				animate={{
					width: yCoord ? '50%' : 0,
					height: yCoord ? '100%' : 0,
					top: yCoord ? 0 : '50%',
					opacity: yCoord ? 1 : 0,
				}}/>
			<motion.div
				animate={{
					width: isOver ? 20 : 0,
				}}
				className="side-drop-target__drop-hint" />
		</div>
	);
};

interface WithSideDropTargetProps {
	shouldWrap?: boolean;
}

export const withSideDropTarget = <P extends object>(Component: React.ComponentType<P>) =>
	class WithSideDropTarget extends React.Component<P & WithSideDropTargetProps & WindowSideDropTargetProps> {
		render() {
			const { shouldWrap = false, moveTabToNewWindow, ...props } = this.props;
			return shouldWrap
				? <WindowSideDropTarget moveTabToNewWindow={moveTabToNewWindow}>
					<Component {...props as P}/>
				</WindowSideDropTarget>
				: <Component {...props as P}/>;
		}
	};
