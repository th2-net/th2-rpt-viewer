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
import GraphItemsMenu from './GraphItemsMenu';
import { createBemElement } from '../../helpers/styleCreators';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { GraphGroup, GraphItem, GraphItemType } from '../../models/Graph';
import { getEventStatus, isEventMessage, isEventNode } from '../../helpers/event';
import { GraphDataStore } from '../../stores/graph/GraphDataStore';

interface GraphItemsGroupProps {
	group: GraphGroup;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphDataStore>['getGraphItemType'];
}

function GraphItemsGroup(props: GraphItemsGroupProps) {
	const { group, onGraphItemClick, getGraphItemType } = props;

	const groupRef = React.useRef<HTMLDivElement>(null);
	const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

	function handleClick() {
		setMenuAnchor(groupRef.current);
	}

	return (
		<div className='graph-item-group' ref={groupRef} style={{ left: group.left }}>
			<div className='graph-item-group__dots'>
				{group.items.slice(0, 3).map(item => (
					<GraphDot
						key={isEventMessage(item) ? item.messageId : item.eventId}
						item={item}
						openMenu={handleClick}
						className={
							group.items.length === 1 &&
							getGraphItemType(group.items[0]) === GraphItemType.PINNED_MESSAGE
								? 'graph-dot__pinned-message full'
								: undefined
						}
						type={getGraphItemType(item)}
					/>
				))}
			</div>
			<GraphItemsMenu
				getGraphItemType={getGraphItemType}
				onMenuItemClick={onGraphItemClick}
				items={group.items}
				isMenuOpened={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
				anchorEl={menuAnchor}
			/>
		</div>
	);
}

export default GraphItemsGroup;

interface GraphDotProps {
	item: GraphItem;
	className?: string;
	type: string;
	openMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function GraphDot(props: GraphDotProps) {
	const { item, className, openMenu, type } = props;

	const itemClass = createBemElement(
		'graph-dot',
		type,
		isEventNode(item) ? getEventStatus(item) : null,
	);

	return <div className={className || itemClass} onClick={openMenu} />;
}
