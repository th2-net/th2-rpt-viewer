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
		return outsidePan;
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
		const panelTypes = Object.keys(outsidePanels[direction]);
		// we already know that 'panels' is not empty, so previously implemented check is unnecessary
		const panels = panelsRange.filter(p => panelTypes.includes(p.type));

		const windowRange = to - from;
		const windowCenter = from + windowRange / 2;

		// the first condition is needed in case  t > 30min.
		// then there is no point in centering while inside the event.
		const center0 =
			panels[0].range[1] - panels[0].range[0] < windowRange
				? (panels[0].range[1] + panels[0].range[0]) / 2
				: 0;
		const center1 =
			panels[1] && panels[1].range[1] - panels[1].range[0] < windowRange
				? (panels[1].range[1] + panels[1].range[0]) / 2
				: 0;

		if (direction === 'left') {
			const isLeftCovered =
				(panels[0].range[1] > from && panels[0].range[0] < from) ||
				(panels[1] && panels[1].range[1] > from && panels[1].range[0] < from);

			if (isLeftCovered) {
				const centerTo = [center0, center1]
					.filter(center => windowCenter - center > 0 && windowCenter - center < windowRange)
					.sort((a, b) => b - a)[0];

				if (centerTo) {
					onPanelRangeSelect([centerTo - windowRange / 2, centerTo + windowRange / 2]);
				} else {
					// check, whether we need to jump the full interval, or just reveal the remaining part.
					const newLeftBorder = [panels[0].range[0], panels[1] ? panels[1].range[0] : 0]
						.filter(leftBorder => from - leftBorder < windowRange - 5000)
						.sort((a, b) => b - a)[0];
					if (newLeftBorder) {
						onPanelRangeSelect([newLeftBorder - 5000, newLeftBorder + windowRange - 5000]);
					} else {
						onPanelRangeSelect([from - windowRange, to - windowRange]);
					}
				}
			} else {
				// here we decide, whether we can jump to closest center without missing closest border
				let closestBorder;
				if (panels[1]) {
					closestBorder =
						panels[0].range[1] > panels[1].range[1] ? panels[0].range[1] : panels[1].range[1];
				} else {
					closestBorder = panels[0].range[1];
				}
				const closestCenter = [center0, center1].filter(a => a > 0).sort((a, b) => b - a)[0];

				if (closestBorder - closestCenter < windowRange / 2) {
					onPanelRangeSelect([closestCenter - windowRange / 2, closestCenter + windowRange / 2]);
				} else {
					// in this case we decide to already move from the rightmost border, so extra 5sec is ok
					onPanelRangeSelect([closestBorder - windowRange + 5000, closestBorder + 5000]);
				}
			}
		} else {
			const isRightCovered =
				(panels[0].range[1] > to && panels[0].range[0] < to) ||
				(panels[1] && panels[1].range[1] > to && panels[1].range[0] < to);

			if (isRightCovered) {
				const centerTo = [center0, center1]
					.filter(
						center =>
							center > 0 && center - windowCenter > 0 && center - windowCenter < windowRange,
					)
					.sort((a, b) => b - a)[0];

				if (centerTo) {
					onPanelRangeSelect([centerTo - windowRange / 2, centerTo + windowRange / 2]);
				} else {
					// check, whether we need to jump the full interval, or just reveal the remaining part.
					const newRightBorder = [panels[0].range[1], panels[1] ? panels[1].range[1] : 0]
						.filter(rightBorder => rightBorder > 0 && rightBorder - to < windowRange - 5000)
						.sort((a, b) => a - b)[0];
					if (newRightBorder) {
						onPanelRangeSelect([newRightBorder - windowRange + 5000, newRightBorder + 5000]);
					} else {
						onPanelRangeSelect([from + windowRange, to + windowRange]);
					}
				}
			} else {
				// here we decide, whether we can jump to closest center without missing closest border
				let closestBorder;
				if (panels[1]) {
					closestBorder =
						panels[0].range[0] > panels[1].range[0] ? panels[1].range[0] : panels[0].range[0];
				} else {
					closestBorder = panels[0].range[1];
				}
				const closestCenter = [center0, center1].filter(a => a > 0).sort((a, b) => a - b)[0];

				if (closestCenter - closestBorder < windowRange / 2) {
					onPanelRangeSelect([closestCenter - windowRange / 2, closestCenter + windowRange / 2]);
				} else {
					// in this case we decide to already move from the leftmost border, so extra 5sec is ok
					onPanelRangeSelect([closestBorder - 5000, closestBorder + windowRange - 5000]);
				}
			}
			// const isRightCovered =
			// 	(panels[0].range[0] < to && panels[0].range[1] > to) ||
			// 	(panels[1] && panels[1].range[0] < to && panels[1].range[1] > to);

			// const center0 =
			// 	panels[0].range[1] - panels[0].range[0] < windowRange
			// 		? (panels[0].range[1] + panels[0].range[0]) / 2
			// 		: 0;
			// const center1 =
			// 	panels[1] && panels[1].range[1] - panels[1].range[0] < windowRange
			// 		? (panels[1].range[1] + panels[1].range[0]) / 2
			// 		: 0;

			// if (isRightCovered) {
			// 	const centerTo = [center0, center1]
			// 		.filter(center => center - windowCenter > 0 && center - windowCenter < windowRange)
			// 		.sort((a, b) => a - b)[0];
			// 	if (centerTo) {
			// 		onPanelRangeSelect([centerTo - windowRange / 2, centerTo + windowRange / 2]);
			// 	} else {
			// 		onPanelRangeSelect([from + windowRange, to + windowRange]);
			// 	}
			// } else {
			// 	const centerTo = [center0, center1].filter(a => a > 0).sort((a, b) => a - b)[0];
			// 	// why do we need the next line?
			// 	// i spose we stand before a question of centering the closest thing. we should probably
			// 	// change what stands after the "-"
			// 	if (centerTo && centerTo - windowCenter < windowRange) {
			// 		onPanelRangeSelect([centerTo - windowRange / 2, centerTo + windowRange / 2]);
			// 	} else if (centerTo) {
			// 		if (centerTo === center0) {
			// 			onPanelRangeSelect([panels[0].range[0], panels[0].range[0] + windowRange]);
			// 		} else {
			// 			onPanelRangeSelect([panels[1].range[0], panels[1].range[0] + windowRange]);
			// 		}
			// 	}
			// }
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
