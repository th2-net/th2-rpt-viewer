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
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import EventsColumn from './EventsColumn';
import '../../../styles/events.scss';
import EventBreadcrumbs from '../EventBreadcrumbs';
import EventDetailInfo from '../EventDetailInfo';
import useElementSize from '../../../hooks/useElementSize';

function EventTableWindow() {
	const eventsStore = useEventWindowStore();
	const rootRef = React.useRef<HTMLDivElement>(null);
	const { width } = useElementSize(rootRef);

	return (
		<div className='event-table-window' ref={rootRef}>
			<div className='event-table-window__breadcrumbs'>
				<EventBreadcrumbs
					rootEventsEnabled
					nodes={eventsStore.selectedPath}
					onSelect={eventsStore.selectNode}/>
			</div>
			<div className='event-table-window__columns'>
				{
					eventsStore.selectedNode == null ? (
						<EventsColumn nodesList={eventsStore.eventsIds}/>
					) : (
						<>
							{
								eventsStore.selectedPath.map(parentNode => (
									parentNode.children?.length
										? <EventsColumn nodesList={parentNode.children} key={parentNode.id}/>
										: null
								))
							}
							<div style={{ width: width * 0.4, flexShrink: 0 }}>
								<EventDetailInfo idNode={eventsStore.selectedNode}/>
							</div>
						</>
					)
				}
			</div>
		</div>
	);
}

export default observer(EventTableWindow);
