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
import moment from 'moment';
import { isEventMessage } from '../../helpers/event';
import { SearchHistory } from './SearchPanel';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { getTimestampAsNumber } from '../../helpers/date';
import { createStyleSelector } from '../../helpers/styleCreators';

interface SearchPanelResultsProps {
	onResultItemClick: (searchResult: EventAction | EventMessage) => void;
	onResultDelete: () => void;
	disableNext: boolean;
	disablePrev: boolean;
	showToggler: boolean;
	next: () => void;
	prev: () => void;
	results: SearchHistory;
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
	const {
		results,
		onResultItemClick,
		onResultDelete,
		disablePrev,
		disableNext,
		showToggler,
		next,
		prev,
	} = props;

	const [resultPair] = Object.entries(results);
	const [timestamp, eventActions] = resultPair;

	return (
		<div className='search-results'>
			{showToggler && (
				<div className='search-results__controls'>
					<button className='search-results__arrow' disabled={disablePrev} onClick={prev}></button>
					<button
						className='search-results__arrow next'
						disabled={disableNext}
						onClick={next}></button>
				</div>
			)}
			<div className='history-point'>
				<p className='history-point__timestamp'>
					{moment(+timestamp)
						.utc()
						.format('DD.MM.YYYY HH:mm:ss.SSS')}
				</p>
				<button className='bookmark-item__remove-btn' onClick={onResultDelete}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			</div>
			<hr />
			{eventActions.map((item: EventAction | EventMessage) => (
				<SearchResult
					key={isEventMessage(item) ? item.messageId : item.eventId}
					item={item}
					onClick={() => {
						onResultItemClick(item);
					}}
				/>
			))}
		</div>
	);
};

export default SearchPanelResults;
interface BookmarkItemProps {
	item: EventMessage | EventAction;
	onRemove?: (item: EventMessage | EventAction) => void;
	onClick?: (item: EventMessage | EventAction) => void;
}

export function SearchResult({ item, onRemove, onClick }: BookmarkItemProps) {
	const itemInfo = {
		status: isEventMessage(item) ? null : item.successful ? 'passed' : 'failed',
		title: isEventMessage(item) ? item.messageId : item.eventName,
		timestamp: getTimestampAsNumber(isEventMessage(item) ? item.timestamp : item.startTimestamp),
	};

	function onBookmarkRemove(event: React.MouseEvent<HTMLButtonElement>) {
		if (onRemove) {
			event.stopPropagation();
			onRemove(item);
		}
	}

	const rootClassName = createStyleSelector('bookmark-item', item.type, itemInfo.status);

	const iconClassName = createStyleSelector(
		'bookmark-item__icon',
		`${item.type}-icon`,
		itemInfo.status,
	);

	return (
		<div onClick={() => onClick && onClick(item)} className={rootClassName}>
			<i className={iconClassName} />
			<div className='bookmark-item__info'>
				<div className='bookmark-item__name' title={itemInfo.title}>
					{itemInfo.title}
				</div>
				<div className='bookmark-item__timestamp'>
					{moment(itemInfo.timestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS')}
				</div>
			</div>
			{onRemove && (
				<button className='bookmark-item__remove-btn' onClick={onBookmarkRemove}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			)}
		</div>
	);
}
