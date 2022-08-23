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
import EventList from '../EventList';
import Empty from '../../util/Empty';
import SplitView from '../../split-view/SplitView';
import { useWorkspaceEventStore, useEventWindowViewStore } from '../../../hooks';
import EventDetailInfoCard from '../EventDetailInfoCard';
import useEventsDataStore from '../../../hooks/useEventsDataStore';

function EventTreeView() {
	const eventsStore = useWorkspaceEventStore();
	const viewStore = useEventWindowViewStore();
	const eventsDataStore = useEventsDataStore();

	return (
		<SplitView panelArea={viewStore.eventsPanelArea} onPanelAreaChange={viewStore.setPanelArea}>
			<SplitViewPane>
				<EventList />
			</SplitViewPane>
			<SplitViewPane>
				{eventsStore.selectedNode === null &&
					!eventsDataStore.isLoadingSelectedEvent &&
					(!eventsDataStore.isError ? (
						<Empty description='Select event' />
					) : (
						<Empty description='Error occured while loading event' />
					))}
				{eventsStore.selectedNode && (
					<EventDetailInfoCard
						node={eventsStore.selectedNode}
						event={eventsStore.selectedEvent}
						eventTreeNode={eventsStore.selectedNode}
						childrenCount={
							(eventsDataStore.parentChildrensMap.get(eventsStore.selectedNode.eventId) || [])
								.length
						}
					/>
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
