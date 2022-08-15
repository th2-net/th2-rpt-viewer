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

import {
	FilterRowMultipleStringsConfig,
	FilterRowStringConfig,
	FilterRowTogglerConfig,
	FilterRowSwitcherConfig,
} from '../../models/filter/FilterInputs';
import { SSEFilterInfo } from '../../api/sse';
import { SearchPanelType } from './SearchPanel';
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';

export type StringFilter = {
	type: 'string';
	values: string;
	negative: boolean;
	hint: string;
};

export type MultipleStringFilter = {
	type: 'string[]';
	values: string[];
	negative: boolean;
	conjunct: boolean;
	hint: string;
};

export type SwitcherFilter = {
	type: 'switcher';
	values: string;
};

export type Filter = StringFilter | MultipleStringFilter | SwitcherFilter;

export type EventFilterState = {
	attachedMessageId: StringFilter;
	type: MultipleStringFilter;
	body: MultipleStringFilter;
	name: MultipleStringFilter;
	status: SwitcherFilter;
	event_generic: MultipleStringFilter;
};

export type MessageFilterState = {
	attachedEventIds: MultipleStringFilter;
	type: MultipleStringFilter;
	body: MultipleStringFilter;
	bodyBinary: MultipleStringFilter;
	message_generic: MultipleStringFilter;
};

export type FilterState = EventFilterState | MessageFilterState;

export type FilterRowConfig =
	| FilterRowSwitcherConfig
	| FilterRowTogglerConfig
	| FilterRowStringConfig
	| FilterRowMultipleStringsConfig;

interface SearchPanelFiltersProps {
	type: SearchPanelType;
	info: SSEFilterInfo[];
	state: FilterState;
	setState: (patch: Partial<FilterState>) => void;
	disableAll: boolean;
	autocompletes: (FiltersHistoryType<EventFilterState> | FiltersHistoryType<MessageFilterState>)[];
}
