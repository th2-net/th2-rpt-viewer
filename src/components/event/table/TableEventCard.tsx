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
import { EventIdNode } from '../../../stores/EventWindowStore';
import PanelArea from '../../../util/PanelArea';
import EventCard from '../EventCardHeader';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import useAsyncEffect from '../../../hooks/useAsyncEffect';
import EventCardSkeleton from '../EventCardSkeleton';
import useCachedEvent from '../../../hooks/useCachedEvent';

interface Props {
	idNode: EventIdNode;
}

function TableEventCard({ idNode }: Props) {
	const eventWindowStore = useEventWindowStore();
	const event = useCachedEvent(idNode);
	const isRoot = idNode.parents.length === 0;

	useAsyncEffect(async () => {
		if (idNode.children == null && !isRoot) {
			await eventWindowStore.fetchEventChildren(idNode);
		}
	}, []);

	if (event == null) {
		return <EventCardSkeleton/>;
	}

	return (
		<EventCard
			event={event}
			childrenCount={isRoot ? 0 : (idNode.children?.length ?? null)}
			panelArea={PanelArea.P100}
			onSelect={() => eventWindowStore.selectNode(idNode)}
			isSelected={eventWindowStore.isNodeSelected(idNode)}/>
	);
}

export default observer(TableEventCard);
