/** *****************************************************************************
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
import { FilterState } from 'modules/search/models/Search';
import { FiltersHistoryType } from '../../stores/FiltersHistoryStore';
import { FiltersState } from './FiltersHistory';
import { EventsFiltersInfo, MessagesFilterInfo } from '../../api/sse';
import { getDefaultEventsFiltersState, getDefaultMessagesFiltersState } from '../../helpers/search';
import { prettifyCamelcase } from '../../helpers/stringUtils';
import { createBemElement } from '../../helpers/styleCreators';
import { useDebouncedCallback } from '../../hooks';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { showNotification } from '../../helpers/showNotification';
import { ShareIcon } from '../icons/ShareIcon';
import { DeleteIcon } from '../icons/DeleteIcon';

const FILTER_HISTORY_DATE_FORMAT = 'DD.MM.YYYY HH:mm:ss.SSS' as const;

interface Props {
	item: FiltersHistoryType<FilterState>;
	filter: FiltersState;
	eventsFilterInfo: EventsFiltersInfo[];
	messagesFilterInfo: MessagesFilterInfo[];
	closeHistory: () => void;
	toggleFilterPin: (filter: FiltersHistoryType<FilterState>) => void;
	deleteHistoryItem: (filter: FiltersHistoryType<FilterState>) => void;
}

const FiltersHistoryItem = (props: Props) => {
	const {
		item,
		filter,
		eventsFilterInfo,
		messagesFilterInfo,
		closeHistory,
		toggleFilterPin,
		deleteHistoryItem,
	} = props;

	const bubblesContainerRef = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

	const pinButtonRef = React.useRef<HTMLButtonElement>(null);
	const shareButtonRef = React.useRef<HTMLButtonElement>(null);

	const rootRef = React.useRef<HTMLDivElement>(null);

	const isHovered = React.useRef(false);

	const onMouseOver = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
		e.persist();
		isHovered.current = true;
		onMouseOverDebounced(e);
	};

	const onMouseOverDebounced = useDebouncedCallback(
		(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			if (!isHovered.current) return;
			const buttons = [...Object.values(bubblesContainerRef.current)].filter(Boolean);
			if (
				e.target instanceof Element &&
				(pinButtonRef.current?.contains(e.target) ||
					shareButtonRef.current?.contains(e.target) ||
					buttons.some(
						buttonContainer =>
							e.target !== buttonContainer && buttonContainer?.contains(e.target as Element),
					))
			) {
				rootRef.current?.classList.remove('active');
			} else {
				rootRef.current?.classList.add('active');
			}
		},
		55,
	);

	const onMouseLeave = () => {
		isHovered.current = false;
		rootRef.current?.classList.remove('active');
	};

	if (!filter) {
		return null;
	}

	function getValuesUpdater<T extends keyof FilterState>(name: T) {
		return function valuesUpdater(values: string | string[]) {
			if (filter) {
				filter.setState({ [name]: { ...filter.state[name], values } });
			}
		};
	}

	function getState<T extends keyof FilterState>(name: T) {
		return filter && filter.state[name];
	}

	function onFilterSelect() {
		if (filter) {
			const defaultState =
				item.type === 'event'
					? getDefaultEventsFiltersState(eventsFilterInfo)
					: getDefaultMessagesFiltersState(messagesFilterInfo);
			filter.setState({ ...defaultState, ...item.filters });
			closeHistory();
		}
	}

	function onFilterBubbleSelect(filterName: keyof FilterState, bubbleValue: string) {
		const state = getState(filterName);
		const stateValues = state?.values;
		const updaterFn = getValuesUpdater(filterName);

		if (typeof stateValues === 'string') {
			updaterFn(bubbleValue);
		}

		if (stateValues && Array.isArray(stateValues)) {
			if (!stateValues.includes(bubbleValue)) {
				updaterFn([...stateValues, bubbleValue]);
			}
		}
	}

	function onFilterPin(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation();
		toggleFilterPin(item);
	}

	function onShareClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation();
		const searchString = new URLSearchParams({
			filters: window.btoa(JSON.stringify(item)),
		});
		copyTextToClipboard(
			[window.location.origin, window.location.pathname, `?${searchString}`].join(''),
		);
		showNotification('Copied to clipboard');
	}

	function onDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation();
		deleteHistoryItem(item);
	}

	const pinButtonClassname = createBemElement(
		'filter-history-item',
		'pin-icon',
		item.isPinned ? 'pinned' : null,
	);

	return (
		<div
			className='filter-history-item'
			onClick={onFilterSelect}
			onMouseOver={onMouseOver}
			onMouseLeave={onMouseLeave}
			ref={rootRef}>
			<div className='filter-history-item__title'>
				{moment.utc(item.timestamp).format(FILTER_HISTORY_DATE_FORMAT)}
				<div className='filter-history-item__controls'>
					<button
						className={pinButtonClassname}
						onClick={onFilterPin}
						ref={pinButtonRef}
						title={item.isPinned ? 'Unpin filter' : 'Pin filter'}>
						<i></i>
					</button>
					<button
						className='filter-history-item__share-icon'
						onClick={onShareClick}
						ref={shareButtonRef}
						title='Share filters'>
						<ShareIcon />
					</button>
					<button
						className='filter-history-item__delete-icon'
						onClick={onDeleteClick}
						ref={shareButtonRef}
						title='Delete from history'>
						<DeleteIcon />
					</button>
				</div>
			</div>
			{Object.entries(item.filters).map(([key, value]) => {
				const filterName = key as keyof FilterState;

				return (
					value && (
						<FilterHistoryItemRow
							key={`${item.timestamp}-${filterName}`}
							onBubbleClick={onFilterBubbleSelect}
							filterName={filterName}
							value={value.values}
							isExcluded={Boolean(item.filters[filterName]?.negative)}
							isPinned={item.isPinned}
							ref={ref => (bubblesContainerRef.current[filterName] = ref)}
						/>
					)
				);
			})}
		</div>
	);
};

export default React.memo(FiltersHistoryItem);

interface FilterHistoryItemRowProps {
	filterName: keyof FilterState;
	isExcluded: boolean;
	isPinned?: boolean;
	value: string | string[];
	onBubbleClick: (filterName: keyof FilterState, value: string) => void;
}

const FilterHistoryItemRow = React.forwardRef<HTMLDivElement, FilterHistoryItemRowProps>(
	(props, bubblesContainerRef) => {
		const { filterName, isExcluded, value, onBubbleClick } = props;

		const label = prettifyCamelcase(filterName);

		function handleBubbleClick(e: React.MouseEvent, bubbleValue: string) {
			e.stopPropagation();
			onBubbleClick(filterName, bubbleValue);
		}

		const values = typeof value === 'string' ? [value] : [...new Set(value)];

		return (
			<div key={filterName} className='filter-history-item__row'>
				<p className='filter-history-item__row-label'>
					{isExcluded && <span className='filter-history-item__excluded-icon' title='Excluded' />}
					{label}:
				</p>
				<div className='filter-history-item__row-values' ref={bubblesContainerRef}>
					{values.map(filterValue => (
						<button
							title={filterValue}
							className='filter-history-item__row-bubble'
							key={`${filterName}-${filterValue}`}
							onClick={e => handleBubbleClick(e, filterValue)}>
							{filterValue}
						</button>
					))}
				</div>
			</div>
		);
	},
);

FilterHistoryItemRow.displayName = 'FilterHistoryItemRow';
