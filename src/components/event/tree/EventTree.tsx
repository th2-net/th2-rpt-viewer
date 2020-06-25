/** *****************************************************************************
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
import PanelArea from '../../../util/PanelArea';
import EventCardHeader from '../EventCardHeader';
import { useEventWindowViewStore } from '../../../hooks/useEventWindowViewStore';
import { EventIdNode } from '../../../stores/EventsStore';
import EventCardSkeleton from '../EventCardSkeleton';
import ExpandIcon from '../../ExpandIcon';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import useCachedEvent from '../../../hooks/useCachedEvent';
import CardDisplayType from '../../../util/CardDisplayType';
import '../../../styles/expandablePanel.scss';

interface EventTreeProps {
	idNode: EventIdNode;
}

function EventTree({ idNode }: EventTreeProps) {
	const eventWindowStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	const event = useCachedEvent(idNode);
	const onExpandClick = () => eventWindowStore.toggleNode(idNode);

	let expandIconStatus: 'expanded' | 'hidden' | 'loading' | 'none';

	if (event?.childrenIds == null) {
		expandIconStatus = 'loading';
	} else if (event.childrenIds.length === 0) {
		expandIconStatus = 'none';
	} else if (idNode.isExpanded) {
		expandIconStatus = 'expanded';
	} else {
		expandIconStatus = 'hidden';
	}

	return (
		<div className='event-tree-card'
			 style={{ paddingLeft: (viewStore.panelArea === PanelArea.P25 ? 20 : 35) * idNode.parents.length }}>
			<ExpandIcon
				status={expandIconStatus}
				className='event-card__children-icon'
				onClick={onExpandClick}/>
			{
				event ? (
					<EventCardHeader
						isRoot={idNode.parents.length === 0}
						childrenCount={idNode.children?.length}
						event={event}
						displayType={CardDisplayType.MINIMAL}
						onSelect={() => eventWindowStore.selectNode(idNode)}
						isSelected={eventWindowStore.isNodeSelected(idNode)}/>
				) : (
					<EventCardSkeleton/>
				)
			}
		</div>
	);
}

export default observer(EventTree);
