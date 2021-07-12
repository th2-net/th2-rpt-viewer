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
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { GraphGroup, GraphItemType } from '../../models/Graph';
import { GraphStore } from '../../stores/GraphStore';

type GroupItemType =
	| GraphItemType.ATTACHED_MESSAGE
	| GraphItemType.PINNED_MESSAGE
	| GraphItemType.HOVERED_EVENT
	| GraphItemType.HOVERED_EVENT_PASSED
	| GraphItemType.HOVERED_EVENT_FAILED
	| GraphItemType.HOVERED_MESSAGE
	| GraphItemType.FAILED
	| GraphItemType.PASSED;

const listIconsPriority: { [key in GroupItemType]: number } = {
	[GraphItemType.HOVERED_MESSAGE]: 4,
	[GraphItemType.HOVERED_EVENT]: 4,
	[GraphItemType.HOVERED_EVENT_PASSED]: 4,
	[GraphItemType.HOVERED_EVENT_FAILED]: 4,
	[GraphItemType.ATTACHED_MESSAGE]: 3,
	[GraphItemType.PINNED_MESSAGE]: 2,
	[GraphItemType.FAILED]: 1,
	[GraphItemType.PASSED]: 1,
};

const GROUP_MAX_ITEMS = 3;

interface GraphItemsGroupProps {
	group: GraphGroup;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
}

function GraphItemsGroup(props: GraphItemsGroupProps) {
	const { group, onGraphItemClick, getGraphItemType } = props;

	const groupRef = React.useRef<HTMLDivElement>(null);
	const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

	function handleClick() {
		setMenuAnchor(anchor => (anchor ? null : groupRef.current));
	}

	const groupHeader: Array<string> = React.useMemo(() => {
		const map: Partial<Record<GroupItemType, number>> = {};

		group.items.forEach(item => {
			const key = getGraphItemType(item) as GroupItemType;
			map[key] = (map[key] || 0) + 1;
		});

		const entries = Object.entries(map) as Array<[GraphItemType, number]>;
		entries.sort((entryA, entryB) => {
			return (
				listIconsPriority[entryB[0] as GroupItemType] -
				listIconsPriority[entryA[0] as GroupItemType]
			);
		});

		return entries
			.reduce<string[]>((prev, [type, amount], index, array) => {
				const maxItems = Math.max(GROUP_MAX_ITEMS - prev.length - (array.length - 1 - index), 0);
				const step = maxItems >= amount ? amount : maxItems;
				return [...prev, ...new Array(step).fill(null).map(() => type)];
			}, [])
			.reverse();
	}, [group]);

	const dotsClassName = createBemElement('graph-item-group', 'dots', menuAnchor ? 'active' : null);

	return (
		<div className='graph-item-group' ref={groupRef} style={{ left: group.left }}>
			<div className={dotsClassName} onClick={handleClick}>
				{groupHeader.map((itemType, index) => (
					<div className={`graph-dot-bg-${itemType}`} key={`graph-dot-bg-${itemType}-${index}`}>
						<div
							className={createStyleSelector('graph-dot', itemType)}
							key={`${itemType}-${index}`}
						/>
					</div>
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

export default React.memo(GraphItemsGroup);
