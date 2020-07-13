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
import { observer } from 'mobx-react-lite';
import { Flipper } from 'react-flip-toolkit';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import EventsColumn from './EventsColumn';
import CardDisplayType from '../../../util/CardDisplayType';
import EventMinimapColumn from './EventMinimapColumn';
import EventDetailInfoCard from '../EventDetailInfoCard';
import SplashScreen from '../../SplashScreen';
import SplitView from '../../split-view/SplitView';
import Empty from '../../Empty';
import { useEventWindowViewStore } from '../../../hooks/useEventWindowViewStore';
import '../../../styles/events.scss';

function EventTableView() {
	const eventsStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	// removing current selected item - it will be rendered in detail card
	const columns = eventsStore.selectedPath.slice(0, -1);
	const notMinfiedColumns = columns.slice(-3);
	const minimapDeep = columns.length - notMinfiedColumns.length;

	return (
		<Flipper
			className='event-table-view'
			flipKey={eventsStore.selectedPath.reduce((acc, node) => `${acc}-${node.id}`, '')}
			staggerConfig={{ default: { speed: 1 } }}>
			<SplitView
				panelArea={viewStore.panelArea}
				onPanelAreaChange={viewStore.setPanelArea}
				leftPanelMinWidth={445}
				rightPanelMinWidth={445}>
				<div className='event-table-view__columns'>
					{
						eventsStore.selectedNode == null ? (
							eventsStore.isLoadingRootEvents ? (
								<SplashScreen/>
							) : (
								<EventsColumn
									nodesList={eventsStore.eventsIds}
									displayType={CardDisplayType.MINIMAL}/>
							)
						) : (
							<>
								<EventMinimapColumn
									nodes={eventsStore.selectedPath[0].children!}
									deep={minimapDeep}/>
								{
									notMinfiedColumns.map((parentNode, i) => (
										parentNode.children?.length
											? <EventsColumn
												displayType={calculateCardLayout(i, notMinfiedColumns.length)}
												nodesList={parentNode.children}
												key={parentNode.id}/>
											: null
									))
								}
							</>
						)
					}
				</div>
				{
					eventsStore.selectedNode ? (
						<EventDetailInfoCard
							idNode={eventsStore.selectedNode}
							showSubNodes/>
					) : (
						<Empty description='Select event'/>
					)
				}
			</SplitView>
		</Flipper>
	);
}

function calculateCardLayout(columnIndex: number, columnsLength: number): CardDisplayType {
	// last columns is always displayed
	if (columnsLength - columnIndex < 2) {
		return CardDisplayType.MINIMAL;
	}

	return CardDisplayType.STATUS_ONLY;
}

export default observer(EventTableView);
