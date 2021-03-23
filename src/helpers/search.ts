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

import { SSEFilterInfo, SSEFilterParameter } from '../api/sse';
import { FilterState } from '../components/search-panel/SearchPanelFilters';
import { SearchHistory } from '../stores/SearchStore';

export function getFilterParameterDefaultValue(
	param: SSEFilterParameter,
): boolean | string | string[] | null {
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

export function getDefaultFilterState(info: SSEFilterInfo[]): FilterState | {} {
	return info.reduce(
		(prev, curr) => ({
			...prev,
			[curr.name]: curr.parameters.reduce(
				(prevParams, currParam) => ({
					...prevParams,
					[currParam.name]: getFilterParameterDefaultValue(currParam),
				}),
				{},
			),
		}),
		{},
	);
}

export function isSearchHistoryEntity(obj: unknown): obj is SearchHistory {
	return typeof obj === 'object' && obj !== null && (obj as SearchHistory).request !== undefined;
}
