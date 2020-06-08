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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Flipped } from 'react-flip-toolkit';
import { EventIdNode } from '../../../stores/EventWindowStore';
import EventCard from '../EventCardHeader';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import EventCardSkeleton from '../EventCardSkeleton';
import useCachedEvent from '../../../hooks/useCachedEvent';
import CardDisplayType from '../../../util/CardDisplayType';

interface Props {
	displayType: CardDisplayType;
	idNode: EventIdNode;
}

function TableEventCard({ idNode, displayType }: Props) {
	const eventWindowStore = useEventWindowStore();
	const event = useCachedEvent(idNode);

	return (
		<Flipped flipId={idNode.id}>
			<div className='event-table-window__card'>
				{
					event != null ? (
						<EventCard
							event={event}
							childrenCount={idNode.children?.length}
							displayType={displayType}
							onSelect={() => eventWindowStore.selectNode(idNode)}
							isSelected={eventWindowStore.isNodeSelected(idNode)}/>
					) : (
						<EventCardSkeleton displayType={displayType}/>
					)
				}
			</div>
		</Flipped>
	);
}

export default observer(TableEventCard);
