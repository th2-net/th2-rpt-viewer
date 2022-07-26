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
import EventsFilterPanel from './EventsFilterPanel';
import { useEventsStore } from '../hooks/useEventsStore';
import useEventsDataStore from '../hooks/useEventsDataStore';
import EventsSearchPanel from './search/EventsSearchPanel';
import { EventsIntervalInput } from './EventsIntervalInput';

function EventWindowHeader() {
	const eventStore = useEventsStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();

	const { activePanel } = useActivePanel();

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
					<EventsIntervalInput />
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
						<button
							className='actions-list__nav'
							onClick={() => eventStore.changeEventsRange(-eventStore.filterStore.interval)}>
							<span className='down' />
							<span className='label'>Older</span>
						</button>
						<button
							className='actions-list__nav'
							onClick={() => eventStore.changeEventsRange(eventStore.filterStore.interval)}>
							<span className='up' />
							<span className='label'>Newer</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default observer(EventWindowHeader);
