/** *****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

import { useMemo } from 'react';
import { useFiltersHistoryStore } from './useFiltersHistoryStore';
import { ConfigAutocompleteLists } from './useFilterConfig';
import { notEmpty } from '../helpers/object';
import { getArrayOfUniques } from '../helpers/array';
import { EventsFiltersInfo } from '../api/sse';

export function useEventFiltersAutocomplete(filterInfo: EventsFiltersInfo[]) {
	const { eventsHistory } = useFiltersHistoryStore();

	return useMemo(() => {
		return filterInfo.reduce((acc, filter) => {
			return {
				...acc,
				[filter.name]: getArrayOfUniques(
					eventsHistory
						.map(item => item.filters[filter.name]?.values)
						.filter(notEmpty)
						.flat(),
				),
			};
		}, {} as ConfigAutocompleteLists);
	}, [eventsHistory, filterInfo]);
}
