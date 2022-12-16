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
import { EventTreeNode } from 'models/EventAction';
import { useEventsStore } from '../../hooks/useEventsStore';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import EventCardHeader from '../event-card/EventCardHeader';
import CardDisplayType from '../../models/CardDisplayType';

interface FlatEventListItemProps {
	node: EventTreeNode;
}

function FlatEventListItem(props: FlatEventListItemProps) {
	const eventsStore = useEventsStore();
	const eventsDataStore = useEventsDataStore();

	const { node } = props;

	return (
		<div className='event-list-item'>
			<EventCardHeader
				childrenCount={0}
				event={node}
				displayType={CardDisplayType.MINIMAL}
				onClick={eventsStore.selectNode}
				isSelected={eventsStore.isNodeSelected(node)}
				isFlatView={true}
				parentsCount={
					node.parentId === null
						? 0
						: eventsStore.getParentNodes(node.eventId, eventsDataStore.eventsCache).length
				}
				isActive={
					eventsStore.selectedPath.length > 0 &&
					eventsStore.selectedPath[eventsStore.selectedPath.length - 1].eventId === node.eventId
				}
			/>
		</div>
	);
}

export default observer(FlatEventListItem);