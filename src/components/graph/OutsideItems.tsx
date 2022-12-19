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
import { GraphItem, PanelRange } from '../../models/Graph';
import { sortByTimestamp } from '../../helpers/event';
import { TimeRange } from '../../models/Timestamp';
import { getTimestampAsNumber } from '../../helpers/date';
import { GraphStore } from '../../stores/GraphStore';
import {
	OutsideItems as IOutsideItems,
	OutsideItemsMenu,
	OutsideItemsList,
	OutsideCenters,
} from './OutsideItemsMenu';
import '../../styles/graph.scss';
import { getFirst, getLast } from '../../helpers/array';

interface OverlayPanelProps {
	range: TimeRange;
	panelsRange: Array<PanelRange>;
	graphItems: GraphItem[];
	onGraphItemClick: (item: GraphItem) => void;
	goToGraphItem: (item: GraphItem) => void;
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
		return outsidePan;
	}, [from, to, panelsRange]);

	const showPanels: OutsideCenters = React.useMemo(() => {
		const center0 = (panelsRange[0].range[0] + panelsRange[0].range[1]) / 2;
		const center1 = (panelsRange[1].range[0] + panelsRange[1].range[1]) / 2;

		const res = {
			left: {
				'events-panel': center0 < from,
				'messages-panel': center1 < from,
			},
			right: {
				'events-panel': center0 > to,
				'messages-panel': center1 > to,
			},
		};
		return res;
	}, [from, to, panelsRange]);

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
			goToGraphItem(utterItem);
		}
	};

	const onOutsidePanelArrowClick = (direction: 'left' | 'right') => {
		const getInterval = (range: TimeRange) => range[1] - range[0];
		const border = direction === 'left' ? from : to;
		const isOutside = (ts: number) => (direction === 'left' ? ts < border : ts > border);
		const closestToBorder = (arr: number[]) =>
			direction === 'left' ? getLast(arr) : getFirst(arr);
		const isIntersected = ([start, end]: TimeRange, ts: number) => ts > start && ts < end;
		const windowInterval = getInterval([from, to]);

		const getPanelOffset = (panel: PanelRange) =>
			closestToBorder(
				panel.range
					.filter(isOutside)
					.map(timestamp =>
						isIntersected(panel.range, border) ? 0 : Math.abs(border - timestamp),
					),
			);
		const sortedPanels = panelsRange
			.filter(panel => panel.range.some(isOutside))
			.sort((panelA, panelB) => {
				const closestA = getPanelOffset(panelA);
				const closestB = getPanelOffset(panelB);
				if (closestA === closestB) {
					return (
						closestToBorder(panelA.range.slice().reverse()) -
						closestToBorder(panelB.range.slice().reverse())
					);
				}
				return closestA - closestB;
			});

		const panel = sortedPanels[0];

		if (panel) {
			if (getInterval(panel.range) < windowInterval) {
				onPanelRangeSelect(panel.range);
			} else {
				const dir = direction === 'left' ? -1 : 1;
				const padding = 5 * 1000 * dir;
				let nextFrom = isIntersected(panel.range, border) ? border : closestToBorder(panel.range);
				const compareFn = direction === 'left' ? Math.max : Math.min;
				const maxTimestamp = direction === 'left' ? panel.range[0] : panel.range[1];
				const nextTo = compareFn(nextFrom + windowInterval * dir, maxTimestamp + padding);
				nextFrom = nextTo + windowInterval * dir * -1;
				const nextRange: TimeRange = [nextFrom, nextTo];
				if (direction === 'left') nextRange.reverse();
				onPanelRangeSelect(nextRange);
			}
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
				showPanels={showPanels}
				itemsMap={outsidePanels.left}
				direction='left'
				className='outside-items__panels'
				onItemClick={onOutsidePanelClick}
				onArrowClick={onOutsidePanelArrowClick}
			/>
			<OutsideItemsList
				showCount={false}
				showPanels={showPanels}
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
