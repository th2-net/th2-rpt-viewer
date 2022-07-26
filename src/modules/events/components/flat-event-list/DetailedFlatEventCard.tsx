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

import { useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEvent } from 'hooks/useEvent';
import { EventTreeNode } from 'models/EventAction';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import EventCardHeader from '../EventCardHeader';
import EventDetailInfoCard from '../EventDetailInfoCard';

interface Props {
	eventTreeNode: EventTreeNode;
	parentNodes: EventTreeNode[];
}

function DetailedFlatEventCard(props: Props) {
	const { eventTreeNode, parentNodes } = props;
	const eventsDataStore = useEventsDataStore();

	const [selectedNode, setSelectedNode] = useState<EventTreeNode>(eventTreeNode);

	const { event } = useEvent(selectedNode.eventId);

	const childrenCount = computed(
		() => (eventsDataStore.parentChildrensMap.get(selectedNode.eventId) || []).length,
	).get();

	return (
		<EventDetailInfoCard
			node={selectedNode}
			event={event}
			eventTreeNode={eventTreeNode}
			childrenCount={childrenCount}>
			{parentNodes.length > 0 && (
				<div className='event-detail-info__parents'>
					{parentNodes.map(eventNode => (
						<EventCardHeader
							key={eventNode.eventId}
							event={eventNode}
							onSelect={!eventNode.isUnknown ? () => setSelectedNode(eventNode) : undefined}
							isActive={selectedNode === eventNode}
						/>
					))}
					{selectedNode && (
						<EventCardHeader
							key={eventTreeNode.eventId}
							event={eventTreeNode}
							onSelect={() => setSelectedNode(eventTreeNode)}
						/>
					)}
				</div>
			)}
		</EventDetailInfoCard>
	);
}

export default observer(DetailedFlatEventCard);
