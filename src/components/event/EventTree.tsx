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
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { EventAction } from '../../models/EventAction';
import PanelArea from '../../util/PanelArea';
import EventTreeNode from './EventTreeNode';
import { ExpandablePanel } from '../ExpandablePanel';
import { useOnScreen } from '../../hooks/useOnScreen';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';
import '../../styles/expandablePanel.scss';

interface EventTreeProps {
	path?: string[];
	event: EventAction;
}

// eslint-disable-next-line prefer-arrow-callback
const EventTree = ({ event, path = [] }: EventTreeProps) => {
	const eventWindowStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	const rootRef = React.useRef<HTMLDivElement>(null);

	const onScreen = useOnScreen(rootRef, '0px');

	React.useEffect(() => {
		if (onScreen && event.parentEventId !== null && !event.subNodes) {
			eventWindowStore.getEventSubNodes(event, path);
		}
	}, [onScreen]);

	const plainEvent = toJS(event);

	return (
		<div ref={rootRef}>
			<ExpandablePanel
				isExpandDisabled={false}
				isExpanded={eventWindowStore.expandPath.includes(event.eventId)}
				onExpand={() => eventWindowStore.expandNode(path, event)}
				showExpandButton={plainEvent.parentEventId === null
					|| (plainEvent.subNodes !== undefined && plainEvent.subNodes.length > 0)}
			>

				<EventTreeNode
					event={event}
					panelArea={viewStore.panelArea}
					onSelect={eventWindowStore.selectEvent}
					path={path}
					isMinified={viewStore.panelArea === PanelArea.P25}
					isSelected={eventWindowStore.selectedEvent?.eventId === event.eventId}
					isExpanded={eventWindowStore.expandPath.includes(event.eventId)} />
				<div style={{ paddingLeft: viewStore.panelArea === PanelArea.P25 ? 20 : 35 }}>
					{event.subNodes?.map(e => <EventTree
						event={e}
						key={e.eventId}
						path={[...path, event.eventId]} />)}
				</div>
			</ExpandablePanel>
		</div>
	);
};

export default observer(EventTree);
