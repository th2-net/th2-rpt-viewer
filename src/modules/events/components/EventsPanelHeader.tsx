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

import { observer } from 'mobx-react-lite';
import { useActivePanel, useWorkspaceStore } from 'hooks/index';
import { createBemElement } from 'helpers/styleCreators';
import { isEventsStore } from 'helpers/stores';
import { EventListArrowNav } from './EventListNavigation';
import EventsFilterPanel from './filter/EventsFilterPanel';
import { useEventsStore } from '../hooks/useEventsStore';
import useEventsDataStore from '../hooks/useEventsDataStore';
import EventsSearchPanel from './search/EventsSearchPanel';
import { SearchDirection } from '../../../models/SearchDirection';

function EventsPanelHeader() {
	const eventsStore = useEventsStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();

	const { activePanel } = useActivePanel();

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventsStore.viewStore.flattenedListView ? 'active' : null,
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
						onClick={eventsStore.viewStore.toggleFlattenEventListView}
						className={flattenButtonClassName}>
						Flat view
					</div>
				</div>
				{eventDataStore.isLoading && (
					<div className='event-window-header__loader'>
						Resolving events<span>.</span>
						<span>.</span>
						<span>.</span>
					</div>
				)}
				{!eventDataStore.isLoading && (
					<div className='event-window-header__nav'>
						<EventListArrowNav direction={SearchDirection.Previous} />
						<EventListArrowNav direction={SearchDirection.Next} />
					</div>
				)}
			</div>
		</div>
	);
}

export default observer(EventsPanelHeader);
