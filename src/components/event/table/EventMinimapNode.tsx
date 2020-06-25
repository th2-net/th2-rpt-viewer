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
import { EventIdNode } from '../../../stores/EventsStore';
import useCachedEvent from '../../../hooks/useCachedEvent';
import { createBemElement } from '../../../helpers/styleCreators';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import { getEventStatus } from '../../../helpers/event';
import { useOnScreen } from '../../../hooks/useOnScreen';

interface Props {
	node: EventIdNode;
	deep: number;
}

function EventMinimapNode({ node, deep }: Props) {
	const eventStore = useEventWindowStore();
	const rootRef = React.useRef<HTMLDivElement>(null);
	const isVisible = useOnScreen(rootRef);
	const event = useCachedEvent(node, isVisible);

	const nodeClassName = event ? createBemElement(
		'event-minimap',
		'item',
		getEventStatus(event),
		eventStore.isNodeSelected(node) ? 'selected' : null,
	) : '';

	return (
		<div className='event-minimap__node' ref={rootRef}>
			{
				event ? (
					<React.Fragment>
						<div className={nodeClassName} onClick={() => eventStore.selectNode(node)}/>
						<div className="event-minimap__sub-nodes">
							{
								node.children && deep !== 1
									? node.children.map(subNode => (
										<EventMinimapNode key={subNode.id} node={subNode} deep={deep - 1}/>))
									: null
							}
						</div>
					</React.Fragment>
				) : (
					<div className={createBemElement('event-minimap', 'item', 'skeleton')}/>
				)
			}
		</div>
	);
}

export default observer(EventMinimapNode);
