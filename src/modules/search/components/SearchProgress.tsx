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

import { observer } from 'mobx-react-lite';
import { Chip } from 'components/Chip';
import { MessagesSearchResult, EventsSearchResult } from '../stores/SearchResult';

interface Props {
	search: MessagesSearchResult | EventsSearchResult | null;
}

export const SearchProgress = observer((props: Props) => {
	if (!props.search) return null;

	const { startTimestamp, endTimestamp, currentTimestamp, count, processedObjectsCount } =
		props.search;
	const searchTime = currentTimestamp - startTimestamp;
	const progress = Math.floor((searchTime / (endTimestamp - startTimestamp)) * 100);

	return (
		<div className='search-progress'>
			<div className='search-progress__info'>
				<div>
					<p className='search-progress__completed'>{progress}% Completed</p>
					<Chip className='search-progress__count'>{count}</Chip>
				</div>

				{processedObjectsCount > 0 && (
					<p className='search-progress__processed'>Processed items: {processedObjectsCount}</p>
				)}
			</div>
			<div className='search-progress__loader'>
				<div className='search-progress__loader-filler' style={{ width: `${progress}%` }}></div>
			</div>
		</div>
	);
});
