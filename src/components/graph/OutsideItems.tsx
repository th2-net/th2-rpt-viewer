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

import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { GraphItem, PanelRange } from '../../models/Graph';
import { sortByTimestamp } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import { getTimestampAsNumber } from '../../helpers/date';
import { GraphStore } from '../../stores/GraphStore';
import {
	OutsideItems as IOutsideItems,
	OutsideItemsMenu,
	OutsideItemsList,
} from './OutsideItemsMenu';
import '../../styles/graph.scss';

interface OverlayPanelProps {
	range: TimeRange;
	panelsRange: Array<PanelRange>;
	graphItems: GraphItem[];
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	goToGraphItem: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
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
		goToGraphItem,
	} = props;

	const outsideItems: IOutsideItems = React.useMemo(() => {
		return {
			left: graphItems.filter(item => getTimestampAsNumber(item) < from),
			right: graphItems.filter(item => getTimestampAsNumber(item) > to),
		};
	}, [from, to, graphItems]);

	const outsidePanels = React.useMemo(() => {
		const outsidePan = {
			left: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[0] < from)
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
			right: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[1] > to)
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
		};
		console.log(
			'panelsRange.filter(panelRange => panelRange.range != null && panelRange.range[1] > to)',
		);
		console.log(
			panelsRange.filter(panelRange => panelRange.range != null && panelRange.range[1] > to),
		);
		console.log('CHECK IF THIS IS CORRECT:    outsidePan');
		console.log(outsidePan);
		return outsidePan;
	}, [from, to, panelsRange]);

	const onOutsidePanelClick = (panelKey: string) => {
		console.log('onOutsidePanelClick');
		const panel = panelsRange.find(p => p.type === panelKey);
		if (panel) {
			onPanelRangeSelect(panel.range);
		}
	};

	const onOutsideItemsArrowClick = (direction: 'left' | 'right') => {
		const items = sortByTimestamp(outsideItems[direction]);
		const utterItem = items[direction === 'right' ? items.length - 1 : 0];
		if (utterItem) {
			goToGraphItem(utterItem);
		}
	};

	const onOutsidePanelArrowClick = (direction: 'left' | 'right') => {
		const panelTypes = Object.keys(outsidePanels[direction]);
		const panels = panelsRange.filter(p => panelTypes.includes(p.type));
		if (direction === 'left') {
			// the one we meet on our way to the left, is panelsSorted[0]
			const panelsSorted = panels.sort((p1, p2) => p2.range[0] - p1.range[0]);
			const panel = panelsSorted[0];
			if (panel) {
				const windowRange = to - from;
				// check whether we should center it
				if (from - panel.range[0] < windowRange && panel.range[1] - panel.range[0] < to - from) {
					console.log('main branch ;left; executed');
					onPanelRangeSelect(panel.range);
				} else {
					console.log('else branch ;left; executed');
					onPanelRangeSelect([from - windowRange, to - windowRange]);
				}
			}
		} else {
			const panelsSorted = panels.sort((p1, p2) => p1.range[1] - p2.range[1]);
			const panel = panelsSorted[0];
			// check whether we should center it
			// i think the first check is unnecessary, we prolly checked for it previously

			if (panel) {
				const windowRange = to - from;
				console.log('*******************');
				console.log(windowRange);
				console.log(to, from);
				console.log('*******************');
				if (panel.range[1] - to < windowRange && panel.range[1] - panel.range[0] < to - from) {
					console.log('main branch ;right; executed');
					onPanelRangeSelect(panel.range);
				} else {
					console.log('else branch ;right; executed');
					onPanelRangeSelect([from + windowRange, to + windowRange]);
				}
			}
		}
	};

	useEffect(() => {
		console.log(from, to, outsidePanels);
	});

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
