/** ****************************************************************************
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
import SplitView from './SplitView';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import EventList from './event/EventList';
import VerificationCard from './event/VerificationCard';
import EventCard from './event/EventCard';
import MessagesCardList from './message/MessagesCardList';
import { EventAction } from '../models/EventAction';
import { useEventWindowStore } from '../hooks/useEventWindowStore';
import { useEventWindowViewStore } from '../hooks/useEventWindowViewStore';
import Empty from './Empty';
import '../styles/events.scss';

const EventWindow = () => {
	const eventWindowStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	React.useEffect(() => {
		eventWindowStore.getRootEvents();
	}, []);

	const renderSelectedEvent = (event: EventAction | null) => {
		if (!event) return <Empty description="Select event" />;
		return (
			<div style={{ overflow: 'auto', height: '100%' }}>
				{event.body && event.body.type === 'verification'
					? <VerificationCard
						key={event.eventId}
						verification={event}
						isSelected={true}
						isTransparent={false}
						parentActionId={event.parentEventId as any} />
					: <EventCard
						key={event.eventId}
						event={event}
						panelArea={viewStore.panelArea} />
				}
			</div>);
	};

	return (
		<div className="event-window">
			<SplitView
				panelArea={viewStore.panelArea}
				onPanelAreaChange={viewStore.setPanelArea}
				leftPanelMinWidth={500}
				rightPanelMinWidth={620}>
				<LeftPanel>
					<EventList />
				</LeftPanel>
				<RightPanel>
					<div className="layout-panel__content-wrapper">
						{renderSelectedEvent(eventWindowStore.selectedEvent)}
					</div>
				</RightPanel>
			</SplitView>
			<div
				className="event-window__messages"
				style={{
					visibility: viewStore.showMessages ? 'visible' : 'hidden',
				}}>
				<MessagesCardList />
			</div>
		</div>
	);
};

export default observer(EventWindow);
