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

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import SplitViewPane from 'components/split-view/SplitViewPane';
import Empty from 'components/util/Empty';
import SplitView from 'components/split-view/SplitView';
import { useEventsStore } from '../../hooks/useEventsStore';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import EventList from '../EventList';
import EventWindowHeader from '../EventWindowHeader';
import EventDetailInfoCard from '../EventDetailInfoCard';

function EventTreeView() {
	const eventsStore = useEventsStore();
	const viewStore = useEventWindowViewStore();
	const eventDataStore = useEventsDataStore();

	const node = eventsStore.selectedNode;

	const parentNodes = computed(() =>
		!node || node.parentId === null
			? []
			: eventsStore.getParentNodes(node.eventId, eventDataStore.eventsCache),
	).get();

	return (
		<SplitView panelArea={viewStore.eventsPanelArea} onPanelAreaChange={viewStore.setPanelArea}>
			<SplitViewPane>
				<EventWindowHeader />
				<EventList isFlat={true} />
			</SplitViewPane>
			<SplitViewPane>
				{node ? (
					<EventDetailInfoCard node={node} parentNodes={parentNodes} />
				) : (
					<Empty description='Select event' />
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
