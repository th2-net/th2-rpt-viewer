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
import { useMessagesStore } from './useMessagesStore';
import { ConfigAutocompleteLists } from '../../../hooks/useFilterConfig';
import { useFilterStore } from './useFilterStore';
import { notEmpty } from '../../../helpers/object';
import { uniq } from '../../../helpers/array';

export function useSessionAutocomplete() {
	const messagesStore = useMessagesStore();

	return useMemo(
		() => uniq([...messagesStore.sessionsHistory, ...messagesStore.messageSessions]),
		[messagesStore.messageSessions],
	);
}

export function useMessageFiltersAutocomplete() {
	const messagesStore = useMessagesStore();
	const filterStore = useFilterStore();

	return useMemo(
		() =>
			filterStore.filterInfo.reduce(
				(acc, filter) => ({
					...acc,
					[filter.name]: uniq(
						messagesStore.filtersHistory
							.map(item => item.filters[filter.name]?.values)
							.filter(notEmpty)
							.flat(),
					),
				}),
				{} as ConfigAutocompleteLists,
			),
		[messagesStore.filtersHistory, filterStore.filterInfo],
	);
}
