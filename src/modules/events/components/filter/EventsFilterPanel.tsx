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

import React from 'react';
import { observer } from 'mobx-react-lite';
import EventsFilter from 'models/filter/EventsFilter';
import { useFiltersHistoryStore } from 'hooks/useFiltersHistoryStore';
import FilterPanel from 'components/filter/FilterPanel';
import { useFilterConfig } from 'hooks/useFilterConfig';
import { EventFilterKeys } from 'api/sse';
import { useEventsFilterStore } from '../../hooks/useEventsFilterStore';
import { useEventsStore } from '../../hooks/useEventsStore';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { useEventFiltersAutocomplete } from '../../hooks/useEventAutocomplete';

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

function EventsFilterPanel() {
	const eventsStore = useEventsStore();
	const eventDataStore = useEventsDataStore();
	const filterStore = useEventsFilterStore();
	const { onEventFilterSubmit } = useFiltersHistoryStore();

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

	const onSubmit = React.useCallback(() => {
		if (filter) {
			eventsStore.applyFilter(filter);
			onEventFilterSubmit(filter);
		}
	}, [filter]);

	return (
		<FilterPanel
			isLoading={eventDataStore.isLoading}
			isFilterApplied={filterStore.isFilterApplied}
			setShowFilter={filterStore.setIsOpen}
			showFilter={filterStore.isOpen}
			onSubmit={onSubmit}
			onClearAll={eventsStore.clearFilter}
			config={config}
			type='event'
			filter={filter as EventsFilter}
			setFilter={setFilter as any}
		/>
	);
}

export default observer(EventsFilterPanel);
