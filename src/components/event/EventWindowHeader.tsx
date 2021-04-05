/** ****************************************************************************
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
import EventsFilterPanel from '../filter/EventsFilterPanel';
import { useActivePanel, useWorkspaceEventStore, useWorkspaceStore } from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';
import EventsSearchPanel from './search/EventsSearchPanel';
import { isEventsStore } from '../../helpers/stores';
import useEventsDataStore from '../../hooks/useEventsDataStore';

function EventWindowHeader() {
	const { activePanel } = useActivePanel();
	const eventStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventStore.viewStore.flattenedListView ? 'active' : null,
	);

	return (
		<div className='window__controls'>
			<div className='event-window-header'>
				<div className='event-window-header__group'>
					<EventsSearchPanel
						isDisabled={workspaceStore.isActive ? !isEventsStore(activePanel) : true}
					/>
					<EventsFilterPanel />
					<div
						role='button'
						onClick={eventStore.viewStore.toggleFlattenEventListView}
						className={flattenButtonClassName}>
						Flat view
					</div>
				</div>
				{eventStore.isLoadingRootEvents ||
					(eventDataStore.loadingParentEvents.size > 0 && (
						<div className='event-window-header__loader'>
							Resolving root events<span>.</span>
							<span>.</span>
							<span>.</span>
						</div>
					))}
			</div>
		</div>
	);
}

export default observer(EventWindowHeader);
