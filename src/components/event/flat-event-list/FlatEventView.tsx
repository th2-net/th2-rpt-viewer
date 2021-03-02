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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import SplitViewPane from '../../split-view/SplitViewPane';
import FlatEventList from './FlatEventList';
import Empty from '../../util/Empty';
import SplitView from '../../split-view/SplitView';
import { useWorkspaceEventStore, useEventWindowViewStore } from '../../../hooks';
import DetailedFlatEventCard from './DetailedFlatEventCard';
import EventWindowHeader from '../EventWindowHeader';
import useEventsDataStore from '../../../hooks/useEventsDataStore';

function EventTreeView() {
	const eventWindowStore = useWorkspaceEventStore();
	const viewStore = useEventWindowViewStore();
	const eventDataStore = useEventsDataStore();

	return (
		<SplitView panelArea={viewStore.eventsPanelArea} onPanelAreaChange={viewStore.setPanelArea}>
			<SplitViewPane>
				<EventWindowHeader />
				<FlatEventList nodes={eventWindowStore.flattenedEventList} />
			</SplitViewPane>
			<SplitViewPane>
				{eventWindowStore.selectedNode === null &&
					!eventDataStore.loadingSelectedEvent &&
					(eventDataStore.eventTreeStatusCode === null ? (
						<Empty description='Select event' />
					) : (
						<Empty
							description={
								typeof eventDataStore.eventTreeStatusCode === 'number'
									? `Server responded with ${eventDataStore.eventTreeStatusCode} code`
									: 'Error occured while loading event'
							}
						/>
					))}
				{eventWindowStore.selectedNode && (
					<DetailedFlatEventCard
						eventTreeNode={eventWindowStore.selectedNode}
						parentNodes={eventWindowStore.selectedPath.filter(
							node => node !== eventWindowStore.selectedNode,
						)}
					/>
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
