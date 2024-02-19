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
import { computed } from 'mobx';
import EventsFilterPanel from '../filter/EventsFilterPanel';
import { useActivePanel, useWorkspaceEventStore, useWorkspaceStore } from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';
import EventsSearchPanel from './search/EventsSearchPanel';
import { EventListArrowNav } from './EventListNavigation';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { isEventsStore } from '../../helpers/stores';
import { EventsIntervalInput } from './EventsIntervalInput';
import Select from '../util/Select';
import { useBooksStore } from '../../hooks/useBooksStore';
import { SearchDirection } from '../../models/search/SearchDirection';

function EventWindowHeader() {
	const eventStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();
	const booksStore = useBooksStore();

	const { activePanel } = useActivePanel();

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventStore.viewStore.flattenedListView ? 'active' : null,
	);

	const scopeList = computed(() =>
		[...booksStore.scopeList].sort((a, b) => a.localeCompare(b)),
	).get();

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
				<Select
					className='event-window-header__scope'
					options={scopeList}
					onChange={scope => {
						if (scope) {
							eventStore.applyScope(scope);
						}
					}}
					selected={eventStore.scope || ''}
				/>
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

export default observer(EventWindowHeader);
