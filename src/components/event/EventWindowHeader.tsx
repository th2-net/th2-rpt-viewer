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
import {
	useActivePanel,
	useWorkspaceEventStore,
	useWorkspaceStore,
	useEventsFilterStore,
} from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';
import EventsSearchPanel from './search/EventsSearchPanel';
import { EventListNavUp, EventListNavDown } from './EventListNavigation';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { isEventsStore } from '../../helpers/stores';
import { EventsIntervalInput } from './EventsIntervalInput';
import FilterConfig from '../filter/FilterConfig';
import { EventFilterKeys } from '../../api/sse';
import FiltersHistory from '../filters-history/FiltersHistory';
import FilterButton from '../filter/FilterButton';
import { useEventFiltersAutocomplete } from '../../hooks/useEventAutocomplete';
import { useFilterConfig } from '../../hooks/useFilterConfig';

const filterOrder: EventFilterKeys[] = [
	'attachedMessageId',
	'type',
	'body',
	'name',
	'event_generic',
	'status',
];
const classNames = {
	'string[]': {
		className: '',
		labelClassName: '',
	},
} as const;

function EventWindowHeader() {
	const eventsStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const workspaceStore = useWorkspaceStore();
	const filterStore = useEventsFilterStore();

	const { activePanel } = useActivePanel();

	const autocompleteLists = useEventFiltersAutocomplete(filterStore.filterInfo);

	const { config, filter, setFilter } = useFilterConfig({
		filterInfo: filterStore.filterInfo,
		disabled: false,
		filter: filterStore.filter,
		classNames,
		order: filterOrder,
		autocompleteLists,
	});

	React.useEffect(() => {
		setFilter(filterStore.filter || null);
	}, [filterStore.filter]);

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventsStore.viewStore.flattenedListView ? 'active' : null,
	);

	const onSubmit = React.useCallback(() => {
		if (filter) {
			eventsStore.applyFilter(filter);
		}
	}, [filter]);

	return (
		<div className='window__controls'>
			<div className='event-window-header'>
				<div className='event-window-header__group'>
					<EventsSearchPanel
						isDisabled={workspaceStore.isActive ? !isEventsStore(activePanel) : true}
					/>
					<FilterButton
						isLoading={eventDataStore.isLoading}
						isFilterApplied={filterStore.isFilterApplied}
						showFilter={filterStore.isOpen}
						setShowFilter={filterStore.setIsOpen}
					/>
					<div
						role='button'
						onClick={eventsStore.viewStore.toggleFlattenEventListView}
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
						<EventListNavUp />
						<EventListNavDown />
					</div>
				)}
			</div>
			<FilterConfig
				config={config}
				showFilter={filterStore.isOpen}
				setShowFilter={filterStore.setIsOpen}
				onSubmit={onSubmit}
				onClearAll={eventsStore.clearFilter}
				renderFooter={() =>
					filter && (
						<FiltersHistory
							type='event'
							sseFilter={{
								state: filter,
								setState: setFilter as any,
							}}
						/>
					)
				}
			/>
		</div>
	);
}

export default observer(EventWindowHeader);
