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
import { observer } from 'mobx-react-lite';
import { EventTreeNode } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import { GraphItem, PanelRange } from 'models/Graph';
import { sortByTimestamp } from 'helpers/event';
import { TimeRange } from 'models/Timestamp';
import { getTimestampAsNumber } from 'helpers/date';
import { GraphStore } from 'stores/GraphStore';
import {
	OutsideItems as IOutsideItems,
	OutsideItemsMenu,
	OutsideItemsList,
} from './OutsideItemsMenu';
import 'styles/graph.scss';

interface OverlayPanelProps {
	range: TimeRange;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
	panelsRange: Array<PanelRange>;
	graphItems: GraphItem[];
	onPanelRangeSelect: (panelRange: TimeRange) => void;
}

const OutsideItems = (props: OverlayPanelProps) => {
	const {
		range: [from, to],
		onGraphItemClick,
		getGraphItemType,
		onPanelRangeSelect,
		panelsRange,
		graphItems,
	} = props;

	const outsideItems: IOutsideItems = React.useMemo(
		() => ({
			left: graphItems.filter(item => getTimestampAsNumber(item) < from),
			right: graphItems.filter(item => getTimestampAsNumber(item) > to),
		}),
		[from, to, graphItems],
	);

	const outsidePanels = React.useMemo(
		() => ({
			left: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[1] < from)
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
			right: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[0] > to)
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
		}),
		[from, to, panelsRange],
	);

	const onOutsidePanelClick = (panelKey: string) => {
		const panel = panelsRange.find(p => p.type === panelKey);
		if (panel) {
			onPanelRangeSelect(panel.range);
		}
	};

	const onOutsideItemsArrowClick = (direction: 'left' | 'right') => {
		const items = sortByTimestamp(outsideItems[direction]);
		const utterItem = items[direction === 'right' ? items.length - 1 : 0];
		if (utterItem) {
			onGraphItemClick(utterItem);
		}
	};

	const onOutsidePanelArrowClick = (direction: 'left' | 'right') => {
		const panelTypes = Object.keys(outsidePanels[direction]);
		const panels = panelsRange.filter(p => panelTypes.includes(p.type));
		const panel = panels.sort((p1, p2) => p1.range[0] - p2.range[1])[0];

		if (panel) {
			onPanelRangeSelect(panel.range);
		}
	};

	return (
		<>
			<OutsideItemsMenu
				onGraphItemClick={onGraphItemClick}
				direction='left'
				items={outsideItems.left}
				getGraphItemType={getGraphItemType}
				onArrowClick={onOutsideItemsArrowClick}
			/>
			<OutsideItemsMenu
				onGraphItemClick={onGraphItemClick}
				direction='right'
				items={outsideItems.right}
				getGraphItemType={getGraphItemType}
				onArrowClick={onOutsideItemsArrowClick}
			/>
			<OutsideItemsList
				showCount={false}
				itemsMap={outsidePanels.left}
				direction='left'
				className='outside-items__panels'
				onItemClick={onOutsidePanelClick}
				onArrowClick={onOutsidePanelArrowClick}
			/>
			<OutsideItemsList
				showCount={false}
				itemsMap={outsidePanels.right}
				direction='right'
				className='outside-items__panels'
				onItemClick={onOutsidePanelClick}
				onArrowClick={onOutsidePanelArrowClick}
			/>
		</>
	);
};

export default observer(OutsideItems);
