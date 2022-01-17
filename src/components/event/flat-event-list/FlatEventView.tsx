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
import DetailedFlatEventCard from './DetailedFlatEventCard';
import EventWindowHeader from '../EventWindowHeader';
import useEventsDataStore from '../../../hooks/useEventsDataStore';

function EventTreeView() {
	const eventsStore = useWorkspaceEventStore();
	const viewStore = useEventWindowViewStore();
	const eventDataStore = useEventsDataStore();

	return (
		<SplitView panelArea={viewStore.eventsPanelArea} onPanelAreaChange={viewStore.setPanelArea}>
			<SplitViewPane>
				<EventWindowHeader />
				<EventList isFlat={true} />
			</SplitViewPane>
			<SplitViewPane>
				{eventsStore.selectedNode === null &&
					!eventDataStore.isLoadingSelectedEvent &&
					(!eventDataStore.isError ? (
						<Empty description='Select event' />
					) : (
						<Empty description='Error occured while loading event' />
					))}
				{eventsStore.selectedNode && (
					<DetailedFlatEventCard
						eventTreeNode={eventsStore.selectedNode}
						parentNodes={
							eventsStore.selectedNode.parentId === null
								? []
								: eventsStore.getParentNodes(
										eventsStore.selectedNode.eventId,
										eventDataStore.eventsCache,
								  )
						}
					/>
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
