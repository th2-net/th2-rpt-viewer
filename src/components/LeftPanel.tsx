/** ****************************************************************************
 * Copyright 2009-2019 Exactpro (Exactpro Systems Limited)
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
import { EventList } from './action/EventList';
import { useStores } from '../hooks/useStores';
import EventCard from './event/EventCard';
import PanelArea from '../util/PanelArea';
import VerificationCard from './action/VerificationCard';
import SplashScreen from './SplashScreen';
import '../styles/layout.scss';

export const LeftPanel = observer(() => {
	const { eventsStore, viewStore } = useStores();

	const renderSelectedElement = () => {
		if (eventsStore.selectedEventIsLoading) {
			return <div style={{ minWidth: '55%', maxWidth: '55%' }}>
				<SplashScreen />
			</div>;
		}
		if (!eventsStore.selectedEvent) return null;
		return (
			<div style={{ minWidth: '55%', maxWidth: '55%', overflow: 'auto' }}>
				{eventsStore.selectedEvent.body && eventsStore.selectedEvent.body.type === 'verification'
					? <VerificationCard
						verification={eventsStore.selectedEvent}
						isSelected={true}
						isTransparent={false}
						parentActionId={eventsStore.selectedEvent.parentEventId as any} />
					: <EventCard
						event={eventsStore.selectedEvent}
						panelArea={viewStore.panelArea} />
				}
			</div>);
	};

	return (
		<div className="layout-panel">
			<div className="layout-panel__content layout-events">
				{eventsStore.eventsList.map(([parentId, children]) =>
					<div
						className="layout-panel__content-wrapper"
						style={{ zIndex: 1 }}
						key={parentId || 'root'}>
						{children.length === 0
							? <SplashScreen />
							: <EventList
								events={children}
								isMinified={eventsStore.selectedEvents.length > 2
								|| (eventsStore.eventsList.length === 2
									&& (!!eventsStore.selectedEvent
									|| eventsStore.selectedEventIsLoading || viewStore.panelArea !== PanelArea.P100))
								|| viewStore.panelArea === PanelArea.P25}
								selectedEvents={eventsStore.selectedEvents} />}
					</div>)}
			</div>
			{renderSelectedElement()}
		</div>
	);
});
