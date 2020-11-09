/** *****************************************************************************
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
import { XYCoord, useDragLayer } from 'react-dnd';
import { DraggableItemTypes } from '../tabs/DraggableTab';
import { MessagesWindowTabPreview } from '../message/MessagesWindowTab';
import { EventsWindowTabPreview } from '../event/EventWindowTab';
import { TabTypes } from '../../models/util/Windows';

const layerStyles: React.CSSProperties = {
	position: 'fixed',
	pointerEvents: 'none',
	zIndex: 100,
	left: 0,
	top: 0,
	width: '100%',
	height: '100%',
};

function getItemStyles(initialOffset: XYCoord | null, currentOffset: XYCoord | null, item: any) {
	if (!initialOffset || !currentOffset) {
		return {
			display: 'none',
		};
	}

	const { x, y } = currentOffset;
	const width = item && item.tabRef.current ? item.tabRef.current.getBoundingClientRect().width : 0;

	const transform = `translate(${x}px, ${y}px)`;
	return {
		transform,
		WebkitTransform: transform,
		minWidth: width,
		maxWIdth: width,
		width,
	};
}

// This component allows us to customize rendering of dragging item
export const CustomDragLayer = () => {
	const { itemType, isDragging, item, initialOffset, currentOffset } = useDragLayer(monitor => ({
		item: monitor.getItem(),
		itemType: monitor.getItemType(),
		initialOffset: monitor.getInitialSourceClientOffset(),
		currentOffset: monitor.getSourceClientOffset(),
		isDragging: monitor.isDragging(),
	}));

	function renderTab() {
		switch (item.payload.type) {
			case TabTypes.Events:
				return (
					<EventsWindowTabPreview store={item.payload.store} isSelected={item.payload.isSelected} />
				);
			case TabTypes.Messages:
				return <MessagesWindowTabPreview isSelected={item.payload.isSelected} />;
			default:
				return null;
		}
	}

	function renderItem() {
		switch (itemType) {
			case DraggableItemTypes.TAB:
				return renderTab();
			default:
				return null;
		}
	}

	if (!isDragging) {
		return null;
	}

	return (
		<div style={layerStyles}>
			<div style={getItemStyles(initialOffset, currentOffset, item)}>{renderItem()}</div>
		</div>
	);
};
