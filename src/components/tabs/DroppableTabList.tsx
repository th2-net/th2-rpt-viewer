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
import { useDrop } from 'react-dnd';
import { DraggableItemTypes } from './DraggableTab';

export const DraggableTabListContext = React.createContext({} as DroppableTabListState);

type ActiveTab = {
	index: number;
	canDropOnLeft: boolean;
	canDropOnRight: boolean;
	windowIndex: number;
} | null;

interface DroppableTabListState {
	setActiveTab: (tab: ActiveTab) => void;
	activeTab: ActiveTab;
	isDragging: boolean;
	setIsDragging: (isDragging: boolean) => void;
}

interface DroppableTabListProps {
	children: React.ReactNode;
}

const DroppableTabList = (props: DroppableTabListProps) => {
	const [activeTab, setActiveTab] = React.useState<ActiveTab | null>(null);
	const [isDragging, setIsDragging] = React.useState(false);

	const [{ isOver }, drop] = useDrop({
		accept: DraggableItemTypes.TAB,
		collect: monitor => ({
			isOver: monitor.isOver(),
		}),
	});

	React.useEffect(() => {
		if (!isOver && activeTab) {
			setActiveTab(null);
		}
	}, [isOver]);

	return (
		<DraggableTabListContext.Provider value={{
			activeTab,
			setActiveTab,
			isDragging,
			setIsDragging,
		}}>
			<div ref={drop} className="droppable-tab-list">
				{props.children}
			</div>
		</DraggableTabListContext.Provider>
	);
};

export default DroppableTabList;
