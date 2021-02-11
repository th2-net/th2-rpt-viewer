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
import moment from 'moment';
import { useActiveWorkspace, useSelectedStore } from '../../hooks';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { PanelRange } from '../../models/Graph';
import { isEventNode, sortByTimestamp } from '../../helpers/event';
import TimestampInput from '../util/timestamp-input/TimestampInput';
import { TimeRange } from '../../models/Timestamp';
import { getTimestampAsNumber } from '../../helpers/date';
import { GraphDataStore } from '../../stores/graph/GraphDataStore';
import { OutsideItems, OutsideItemsMenu, OutsideItemsList } from './OutsideItems';
import '../../styles/graph.scss';

interface OverlayPanelProps {
	range: TimeRange;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
	getGraphItemType: InstanceType<typeof GraphDataStore>['getGraphItemType'];
	panelsRange: Array<PanelRange>;
}

const GraphOverlay = (props: OverlayPanelProps) => {
	const {
		range: [from, to],
		onGraphItemClick,
		getGraphItemType,
		panelsRange,
	} = props;

	const selectedStore = useSelectedStore();
	const activeWorkspace = useActiveWorkspace();

	const outsideItems: OutsideItems = React.useMemo(() => {
		const windowTimeRange = [
			moment(from)
				.subtract(activeWorkspace.graphDataStore.interval / 2, 'minutes')
				.valueOf(),
			moment(to)
				.add(activeWorkspace.graphDataStore.interval / 2, 'minutes')
				.valueOf(),
		];

		return {
			left: selectedStore.graphItems.filter(
				item =>
					getTimestampAsNumber(isEventNode(item) ? item.startTimestamp : item.timestamp) <
					windowTimeRange[0],
			),
			right: selectedStore.graphItems.filter(
				item =>
					getTimestampAsNumber(isEventNode(item) ? item.startTimestamp : item.timestamp) >
					windowTimeRange[1],
			),
		};
	}, [from, to, selectedStore.graphItems]);

	const outsidePanels = React.useMemo(() => {
		const windowTimeRange = [
			moment(from)
				.subtract(activeWorkspace.graphDataStore.interval / 2, 'minutes')
				.valueOf(),
			moment(to)
				.add(activeWorkspace.graphDataStore.interval / 2, 'minutes')
				.valueOf(),
		];

		return {
			left: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[1] < windowTimeRange[0])
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
			right: panelsRange
				.filter(panelRange => panelRange.range != null && panelRange.range[0] > windowTimeRange[1])
				.reduce((prev, curr) => ({ ...prev, [curr.type]: 1 }), {}),
		};
	}, [from, to, panelsRange]);

	const onOutsidePanelClick = (panelKey: string) => {
		const panel = panelsRange.find(p => p.type === panelKey);
		if (panel) {
			activeWorkspace.graphDataStore.timestamp =
				panel.range[0] + (panel.range[1] - panel.range[0]) / 2;
		}
	};

	const onOutsideItemsArrowClick = (direction: 'left' | 'right') => {
		const items = sortByTimestamp(outsideItems[direction]);
		const utterItem = items[direction === 'right' ? items.length - 1 : 0];
		if (utterItem) {
			onGraphItemClick(utterItem);
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
			/>
			<OutsideItemsList
				showCount={false}
				itemsMap={outsidePanels.right}
				direction='right'
				className='outside-items__panels'
				onItemClick={onOutsidePanelClick}
				onArrowClick={onOutsideItemsArrowClick}
			/>
			<i className='th2-logo' />
			<div className='graph-search-input'>
				<TimestampInput
					timestamp={from + (to - from) / 2}
					onTimestampSubmit={activeWorkspace.graphDataStore.setTimestamp}
				/>
			</div>
		</>
	);
};

export default observer(GraphOverlay);
