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

import React from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../hooks/useStores';
import { EventAction } from '../../models/EventAction';
import PanelArea from '../../util/PanelArea';
import EventActionCard from './EventActionCard';
import { ExpandablePanel } from '../ExpandablePanel';

interface EventTreeProps {
	path: string[];
	event: EventAction;
}

const EventTree = ({ event, path }: EventTreeProps) => {
	const { eventsStore, viewStore } = useStores();
	const isSelected = eventsStore.selectedEvent?.eventId === event.eventId
		|| eventsStore.expandPath.includes(event.eventId);
	const isMinified = viewStore.panelArea === PanelArea.P25;
	const plainEvent = toJS(event);
	return (
		<ExpandablePanel
			isExpandDisabled={false}
			isExpanded={eventsStore.expandPath.includes(event.eventId)}
			onExpand={() => {
				if (eventsStore.expandPath.includes(event.eventId)) {
					eventsStore.expandNode(path, event);
				} else {
					eventsStore.expandNode([...path, event.eventId], event);
				}
			}}
			showExpandButton={plainEvent.parentEventId === null
				|| (plainEvent.subNodes !== undefined && plainEvent.subNodes.length > 0)}
		>
			{
				() => (
					<EventActionCard
						event={event}
						panelArea={viewStore.panelArea}
						onSelect={eventsStore.selectEvent}
						loadSubNodes={eventsStore.getEventSubNodes}
						path={path}
						expandPath={eventsStore.expandPath}
						expandNode={eventsStore.expandNode}
						isMinified={isMinified}
						isSelected={isSelected} />
				)
			}
			<div style={{ paddingLeft: isMinified ? 20 : 35 }}>
				{event.subNodes && event.subNodes.map(e =>
					<EventTree
						event={e}
						key={e.eventId}
						path={path.concat(event.eventId)} />)}
			</div>
		</ExpandablePanel>
	);
};

export default observer(EventTree);
