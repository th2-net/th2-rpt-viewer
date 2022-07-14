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
import EventTreeView from './tree/EventTreeView';
import FlatEventView from './flat-event-list/FlatEventView';
import EventBreadcrumbs from './breadcrumbs/EventBreadcrumbs';
import { useEventWindowViewStore } from '../../hooks';
import { EventTreeNode, EventAction } from '../../models/EventAction';
import '../../styles/events.scss';
import { useExperimentalApiEventStore } from './experimental-api/ExperimentalAPIEventStore';

function EventWindow() {
	const eventWindowViewStore = useEventWindowViewStore();
	const eventsStore = useExperimentalApiEventStore();

	const onBreadcrumbItemClick = React.useCallback((node: EventAction | EventTreeNode | null) => {
		const event = node as EventAction;
		if (event) {
			eventsStore.scrollToEvent(event.eventId);
		}
		eventsStore.selectEvent(event);
	}, []);

	return (
		<div className='window'>
			<div className='window__breadcrumbs'>
				<EventBreadcrumbs
					isLoadingSelectedPath={false}
					path={eventsStore.selectedPath}
					onSelect={onBreadcrumbItemClick}
				/>
			</div>
			<div className='window__body'>
				{eventWindowViewStore.flattenedListView ? <FlatEventView /> : <EventTreeView />}
			</div>
		</div>
	);
}

export default observer(EventWindow);
