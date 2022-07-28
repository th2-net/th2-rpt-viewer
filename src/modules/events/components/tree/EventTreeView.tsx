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

import { observer } from 'mobx-react-lite';
import SplitViewPane from 'components/split-view/SplitViewPane';
import Empty from 'components/util/Empty';
import SplitView from 'components/split-view/SplitView';
import { useBookmarksStore } from 'hooks/useBookmarksStore';
import { useEventsStore } from '../../hooks/useEventsStore';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import EventDetailInfoCard from '../event-card/EventDetailInfoCard';
import EventsPanelHeader from '../EventsPanelHeader';
import EventList from '../EventList';

function EventTreeView() {
	const eventsStore = useEventsStore();
	const viewStore = useEventWindowViewStore();
	const bookmarksStore = useBookmarksStore();

	const event = eventsStore.selectedNode;

	const isBookmarked = event
		? bookmarksStore.events.findIndex(bookmarkedEvent => bookmarkedEvent.id === event.eventId) !==
		  -1
		: false;

	return (
		<SplitView panelArea={viewStore.eventsPanelArea} onPanelAreaChange={viewStore.setPanelArea}>
			<SplitViewPane>
				<EventsPanelHeader />
				<EventList />
			</SplitViewPane>
			<SplitViewPane>
				{event ? (
					<EventDetailInfoCard
						isBookmarked={isBookmarked}
						onBookmarkClick={bookmarksStore.toggleEventPin}
						node={event}
						filter={eventsStore.selectedBodyFilter}
					/>
				) : (
					<Empty description='Select event' />
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
