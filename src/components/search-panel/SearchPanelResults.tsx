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

import React, { useReducer, useEffect } from 'react';
import moment from 'moment';
import { Virtuoso } from 'react-virtuoso';
import { isEventAction } from '../../helpers/event';
import { BookmarkItem } from '../BookmarksPanel';
import { SearchHistory } from './SearchPanel';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: EventAction | EventMessage) => void;
	results: Array<SearchHistory>;
}

type Counter = {
	index: number;
	limit: number;
	disableForward: boolean;
	disableBackward: boolean;
};

type Action = {
	type: 'forward' | 'backward' | 'set';
	payload?: number;
};

const reducer = (counter: Counter, action: Action): Counter => {
	const { index, limit } = counter;
	switch (action.type) {
		case 'forward':
			if (index + 1 > limit) {
				return { index, limit, disableForward: true, disableBackward: false };
			}
			return {
				index: index + 1,
				limit,
				disableForward: index + 1 === limit,
				disableBackward: false,
			};
		case 'backward':
			if (index - 1 <= 0) {
				return { index: 0, limit, disableForward: false, disableBackward: true };
			}
			return { index: index - 1, limit, disableForward: false, disableBackward: false };
		case 'set':
			return {
				index: Number(action.payload) - 1,
				limit: Number(action.payload) - 1,
				disableForward: true,
				disableBackward: false,
			};
		default:
			return { index, limit, disableForward: false, disableBackward: false };
	}
};
const SearchPanelResults = (props: SearchPanelResultsProps) => {
	const { results, onResultItemClick } = props;
	const [state, dispatch] = useReducer(reducer, {
		index: results.length === 0 ? 0 : results.length - 1,
		limit: results.length - 1,
		disableForward: true,
		disableBackward: false,
	});

	const { index, disableForward, disableBackward } = state;
	const currentResult = results[index];

	useEffect(() => {
		dispatch({ type: 'set', payload: results.length });
	}, [results]);

	if (!currentResult) {
		return null;
	}
	const [resultPair] = Object.entries(currentResult);
	const [timestamp, eventActions] = resultPair;

	function computeKey(resultIndex: number) {
		const item = eventActions[resultIndex];

		return isEventAction(item) ? item.eventId : item.messageId;
	}

	function renderBookmarkItem(resultIndex: number) {
		return <BookmarkItem item={eventActions[resultIndex]} onClick={onResultItemClick} />;
	}
	return (
		<div className='search-results'>
			{results.length > 1 && (
				<div className='search-results__controls'>
					<button
						className='search-results__arrow'
						disabled={disableBackward}
						onClick={() => dispatch({ type: 'backward' })}></button>
					<button
						className='search-results__arrow next'
						disabled={disableForward}
						onClick={() => dispatch({ type: 'forward' })}></button>
				</div>
			)}
			<p>
				{moment(+timestamp)
					.utc()
					.format('DD.MM.YYYY HH:mm:ss:SSS')}
			</p>
			<hr />
			<p>{JSON.stringify(eventActions)}</p>
			<Virtuoso
				className='search-results__list'
				totalCount={eventActions.length}
				item={renderBookmarkItem}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
};

export default SearchPanelResults;
