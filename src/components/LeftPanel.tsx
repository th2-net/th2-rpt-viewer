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
import { EventAction } from '../models/EventAction';
import '../styles/layout.scss';

export const LeftPanel = observer(() => {
	const { eventsStore, viewStore } = useStores();

	const renderSelectedElement = (event: EventAction, isMinified: boolean, listIndex: number) => {
		if (!event) return null;
		return (
			<div style={{ flex: 3, minWidth: '900px', overflow: 'auto' }}>
				{event.body && event.body.type === 'verification'
					? <VerificationCard
						key={event.eventId}
						verification={event}
						isSelected={true}
						isTransparent={false}
						parentActionId={event.parentEventId as any}
						onSelect={eventsStore.selectEvent}
						listIndex={listIndex}
						loadingSubNodes={eventsStore.loadingEventId === event.eventId}/>
					: <EventCard
						key={event.eventId}
						event={event}
						panelArea={viewStore.panelArea}
						onSelect={eventsStore.selectEvent}
						listIndex={listIndex}
						loadingSubNodes={eventsStore.loadingEventId === event.eventId} />
				}
			</div>);
	};
	return (
		<div className="layout-panel">
			<div className="layout-panel__content layout-events">
				{eventsStore.eventsList.map(([parentId, children], index) => {
					const isMinified = (
						eventsStore.eventsList.length > 2
										|| (eventsStore.eventsList.length === 2
											&& viewStore.panelArea !== PanelArea.P100)
										|| viewStore.panelArea === PanelArea.P25
					);
					if (Array.isArray(children)) {
						return (
							<div
								className="layout-panel__content-wrapper"
								style={{ zIndex: 1 }}
								key={parentId || 'root'}>
								{children.length === 0
									? <SplashScreen />
									: <EventList
										events={children}
										isMinified={isMinified}
										selectedEvents={eventsStore.selectedEvents}
										listIndex={index}
										loadingEventId={eventsStore.loadingEventId} />}
							</div>
						);
					}

					return renderSelectedElement(children, isMinified, index);
				})}
			</div>
		</div>
	);
});

LeftPanel.displayName = 'LeftPanel';
