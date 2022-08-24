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

import { formatTime, getTimestampAsNumber } from 'helpers/date';
import { getItemName, isEventAction } from 'helpers/event';
import { isEventMessage } from 'helpers/message';
import { createBemBlock, createBemElement, createStyleSelector } from 'helpers/styleCreators';
import MessagesFilter from 'models/filter/MessagesFilter';
import EventsFilter from 'models/filter/EventsFilter';
import { SearchResult } from '../stores/SearchStore';

type SearchResultItemProps = {
	result: SearchResult;
	highlighted?: boolean;
	filters: EventsFilter | MessagesFilter;
	onResultClick: (item: SearchResult, isNewWorkspace?: boolean) => void;
};

const SearchResultItem = ({ result, highlighted, onResultClick }: SearchResultItemProps) => {
	const rootClassName = createBemBlock(
		'search-result',
		result.type,
		highlighted ? 'highlight' : null,
	);

	const nameClassName = createBemElement(
		'search-result',
		'name',
		result.type,
		isEventAction(result) ? (result.successful ? 'success' : 'fail') : null,
	);

	const iconClassName = createStyleSelector(
		'search-result__icon',
		`${result.type}-icon`,
		isEventMessage(result) ? null : result.successful ? 'passed' : 'failed',
	);

	return (
		<div className={rootClassName}>
			<i className={iconClassName} />
			<div className={nameClassName} onClick={() => onResultClick(result)}>
				{getItemName(result)}
			</div>
			<div className='search-result__new-workspace' onClick={() => onResultClick(result, true)}>
				Open in a new workspace
			</div>
			<div className='search-result__timestamp'>{formatTime(getTimestampAsNumber(result))}</div>
		</div>
	);
};

export default SearchResultItem;
