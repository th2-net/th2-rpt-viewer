/* eslint-disable react/no-children-prop */
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
import { EventIdNode } from '../../../stores/EventsStore';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import { useParentEvents } from '../../../hooks/useParentEvents';
import EventCardHeader from '../EventCardHeader';
import EventDetailInfoCard from '../EventDetailInfoCard';

interface Props {
	idNode: EventIdNode;
	parentNodes: EventIdNode[];
}

function DetailedFlatEventCard(props: Props) {
	const { idNode, parentNodes } = props;
	const eventWindowStore = useEventWindowStore();

	const {
		selectedParentEvent,
		setSelectedNode,
		selectedNode,
	} = useParentEvents(idNode, parentNodes, eventWindowStore.selectedParentNode);

	const event = selectedNode === null
		? eventWindowStore.selectedEvent
		: selectedParentEvent;

	return (
		<div className="flat-event-detail-card">
			{
				parentNodes.length > 0
				&& <div className="flat-event-detail-card__parents">
					{
						parentNodes
							.map(eventNode =>
								<EventCardHeader
									key={eventNode.id}
									event={eventNode.event}
									onSelect={() => setSelectedNode(eventNode)}
									isSelected={selectedNode === eventNode}
									rootStyle={{ margin: '4px 0' }}/>)
					}
					{
						selectedNode !== null
						&& <EventCardHeader
							key={idNode.id}
							event={idNode.event}
							onSelect={() => setSelectedNode(null)} />
					}
				</div>
			}
			<EventDetailInfoCard
				rootStyle={{
					overflow: 'visible',
					height: 'auto',
					flexGrow: 1,
				}}
				event={event}
				childrenCount={selectedNode?.children.length} />
		</div>
	);
}

export default observer(DetailedFlatEventCard);
