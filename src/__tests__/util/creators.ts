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

import SearchToken, { PanelSearchToken } from '../../models/search/SearchToken';
import SearchSplitResult from '../../models/search/SearchSplitResult';
import Panel from '../../util/Panel';

export function createSearchToken(
	pattern = 'test',
	color = 'default',
	isActive = false,
	isScrollable = true,
	panels: Panel[] = [Panel.ACTIONS, Panel.MESSAGES, Panel.KNOWN_BUGS, Panel.LOGS],
): PanelSearchToken {
	return {
		pattern,
		color,
		isActive,
		isScrollable,
		panels,
	};
}

export function createSearchSplitResult(
	content = '',
	token: SearchToken | null = null,
): SearchSplitResult {
	return {
		content,
		token,
	};
}
