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
import { useWorkspaceEventStore, useEventsFilterStore } from '../../hooks';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { useFilterConfig } from '../../hooks/useFilterConfig';
import { EventFilterKeys } from '../../api/sse';
import { useEventFiltersAutocomplete } from '../../hooks/useEventAutocomplete';
import FilterConfig from './FilterConfig';
import FilterButton from './FilterButton';
import FiltersHistory from '../filters-history/FiltersHistory';

const filterOrder: EventFilterKeys[] = [
	'status',
	'attachedMessageId',
	'type',
	'body',
	'name',
	'event_generic',
];
const classNames = {
	'string[]': {
		className: '',
		labelClassName: '',
	},
} as const;

function EventsFilterPanel() {
	const eventsStore = useWorkspaceEventStore();
	const eventDataStore = useEventsDataStore();
	const filterStore = useEventsFilterStore();

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
		}
	}, [filter]);

	return (
		<>
			<FilterButton
				isLoading={eventDataStore.isLoading}
				isFilterApplied={filterStore.isFilterApplied}
				showFilter={filterStore.isOpen}
				setShowFilter={filterStore.setIsOpen}
			/>
			<FilterConfig
				setShowFilter={filterStore.setIsOpen}
				showFilter={filterStore.isOpen}
				onSubmit={onSubmit}
				onClearAll={eventsStore.clearFilter}
				config={config}
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
		</>
	);
}

export default observer(EventsFilterPanel);
