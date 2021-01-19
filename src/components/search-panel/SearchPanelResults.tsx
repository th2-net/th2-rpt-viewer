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

import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { isEventAction } from '../../helpers/event';
import { EventMessage } from '../../models/EventMessage';
import { EventAction } from '../../models/EventAction';
import { BookmarkItem } from '../BookmarksPanel';

interface SearchPanelResultsProps {
	results: Array<EventAction | EventMessage>;
}

const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const { results } = props;

	function computeKey(index: number) {
		const item = results[index];

		return isEventAction(item) ? item.eventId : item.messageId;
	}

	function renderBookmarkItem(index: number) {
		return <BookmarkItem item={results[index]} />;
	}

	return (
		<div className='search-results'>
			<Virtuoso
				className='search-results__list'
				totalCount={results.length}
				item={renderBookmarkItem}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
};

export default SearchPanelResults;
