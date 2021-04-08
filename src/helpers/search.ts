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

import { EventsFiltersInfo, MessagesFilterInfo, SSEFilterParameter } from '../api/sse';
import {
	EventFilterState,
	MessageFilterState,
} from '../components/search-panel/SearchPanelFilters';
import { SearchHistory } from '../stores/SearchStore';

export function getFilterParameterDefaultValue(param: SSEFilterParameter) {
	if (param.defaultValue === null) {
		switch (param.type.value) {
			case 'boolean':
				return false;
			case 'string':
				return '';
			case 'string[]':
				return [];
			default:
				return null;
		}
	}
	return param.defaultValue;
}

export function getDefaultEventsFiltersState(info: EventsFiltersInfo[]): EventFilterState | null {
	if (!info.length) return null;
	const state = info.reduce((prev, curr) => {
		return {
			...prev,
			[curr.name]: curr.parameters.reduce((prevParams, currParam) => {
				return {
					...prevParams,
					type: currParam.type.value,
					values: getFilterParameterDefaultValue(currParam),
				};
			}, {}),
		};
	}, {} as EventFilterState);

	return state;
}

export function getDefaultMessagesFiltersState(
	info: MessagesFilterInfo[],
): MessageFilterState | null {
	if (!info.length) return null;
	const state = info.reduce((prev, curr) => {
		return {
			...prev,
			[curr.name]: curr.parameters.reduce((prevParams, currParam) => {
				return {
					...prevParams,
					values: getFilterParameterDefaultValue(currParam),
				};
			}, {}),
		};
	}, {} as MessageFilterState);

	return state;
}

export function isSearchHistoryEntity(obj: unknown): obj is SearchHistory {
	return typeof obj === 'object' && obj !== null && (obj as SearchHistory).request !== undefined;
}
