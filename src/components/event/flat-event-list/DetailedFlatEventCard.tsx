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
import { useWorkspaceEventStore, useParentEvents } from '../../../hooks';
import EventCardHeader from '../EventCardHeader';
import EventDetailInfoCard from '../EventDetailInfoCard';
import { EventTreeNode } from '../../../models/EventAction';

interface Props {
	eventTreeNode: EventTreeNode;
	parentNodes: EventTreeNode[];
}

function DetailedFlatEventCard(props: Props) {
	const { eventTreeNode, parentNodes } = props;
	const eventWindowStore = useWorkspaceEventStore();

	const { selectedParentEvent, setSelectedNode, selectedNode } = useParentEvents(
		eventTreeNode,
		parentNodes,
		eventWindowStore.selectedParentNode,
	);

	const event = selectedNode === null ? eventWindowStore.selectedEvent : selectedParentEvent;
	const node = selectedNode === null ? eventWindowStore.selectedNode : selectedNode;

	return (
		<div className='flat-event-detail-card'>
			{parentNodes.length > 0 && (
				<div className='flat-event-detail-card__parents'>
					{parentNodes.map(eventNode => (
						<EventCardHeader
							key={eventNode.eventId}
							event={eventNode}
							onSelect={() => setSelectedNode(eventNode)}
							isSelected={selectedNode === eventNode}
							rootStyle={{ margin: '4px 0' }}
						/>
					))}
					{selectedNode !== null && (
						<EventCardHeader
							key={eventTreeNode.eventId}
							event={eventTreeNode}
							onSelect={() => setSelectedNode(null)}
						/>
					)}
				</div>
			)}
			<EventDetailInfoCard
				node={node!}
				rootStyle={{
					overflow: 'visible',
					height: 'auto',
					flexGrow: 1,
				}}
				event={event}
				childrenCount={selectedNode?.childList.length}
			/>
		</div>
	);
}

export default observer(DetailedFlatEventCard);
